//! POST /verify – check a Groth16 proof and its public inputs.

use actix_web::{HttpResponse, Responder, error::ErrorBadRequest, post, web};

use ark_bn254::{Bn254, Fr, G1Affine, G2Affine};
use ark_crypto_primitives::snark::SNARK;
use ark_groth16::{Groth16, Proof};
use ark_serialize::CanonicalDeserialize;

use base64::{Engine as _, engine::general_purpose::STANDARD as B64};
use serde::Deserialize;
use std::{io::Cursor, sync::Arc};

use crate::state::AppState;

/* ------------ request formats ------------------------------------------------ */

#[derive(Deserialize)]
struct ProofBase64 {
    a: String,
    b: String,
    c: String,
}

#[derive(Deserialize)]
struct VerifyRequest {
    proof: ProofBase64,
    public_inputs: Vec<String>,
}

/* ------------ handler -------------------------------------------------------- */
#[post("/verify")]
pub async fn verify(
    body: web::Json<VerifyRequest>,
    app_state: web::Data<Arc<AppState>>,
) -> Result<impl Responder, actix_web::Error> {
    /* ---- 1. decode & deserialise proof ------------------------------------ */
    let decode_g1 = |s: &str| -> Result<G1Affine, actix_web::Error> {
        let bytes = B64
            .decode(s)
            .map_err(|_| ErrorBadRequest("base64 decode (G1) failed"))?;
        G1Affine::deserialize_uncompressed(&mut Cursor::new(bytes))
            .map_err(|_| ErrorBadRequest("G1 deserialise failed"))
    };

    let decode_g2 = |s: &str| -> Result<G2Affine, actix_web::Error> {
        let bytes = B64
            .decode(s)
            .map_err(|_| ErrorBadRequest("base64 decode (G2) failed"))?;
        G2Affine::deserialize_uncompressed(&mut Cursor::new(bytes))
            .map_err(|_| ErrorBadRequest("G2 deserialise failed"))
    };

    let proof = Proof::<Bn254> {
        a: decode_g1(&body.proof.a)?,
        b: decode_g2(&body.proof.b)?,
        c: decode_g1(&body.proof.c)?,
    };

    /* ---- 2. decode & deserialise public inputs --------------------------- */
    let mut public_inputs = Vec::<Fr>::with_capacity(body.public_inputs.len());

    for (idx, s) in body.public_inputs.iter().enumerate() {
        let bytes = B64
            .decode(s)
            .map_err(|_| ErrorBadRequest(format!("base64 decode (pi #{idx}) failed")))?;
        let f = Fr::deserialize_uncompressed(&mut Cursor::new(bytes))
            .map_err(|_| ErrorBadRequest(format!("field deserialise (pi #{idx}) failed")))?;
        public_inputs.push(f);
    }

    /* ---- 3. verify ------------------------------------------------------- */
    let ok =
        match Groth16::<Bn254>::verify_with_processed_vk(&app_state.pvk, &public_inputs, &proof) {
            Ok(b) => b,
            Err(e) => {
                return Ok(HttpResponse::Ok().json(serde_json::json!({
                    "ok": false,
                    "err_msg": format!("verification error: {e}")
                })));
            }
        };

    /* ---- 4. respond ------------------------------------------------------ */
    Ok(HttpResponse::Ok().json(serde_json::json!({ "ok": ok })))
}
