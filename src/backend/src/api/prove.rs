//! POST /prove – create a Groth16 proof that the user’s point lies in an
//! authorised H3 cell.

use actix_web::{HttpResponse, Responder, error::ErrorBadRequest, post, web};

use ark_bn254::{Bn254, Fr};
use ark_crypto_primitives::{snark::SNARK, sponge::poseidon::PoseidonConfig};
use ark_groth16::Groth16;
use ark_serialize::CanonicalSerialize;
use ark_std::{
    One, Zero,
    rand::{SeedableRng, rngs::StdRng},
};

use base64::{Engine as _, engine::general_purpose::STANDARD as B64};

use h3o::{CellIndex, Resolution};
use serde::Deserialize;
use std::{str::FromStr, sync::Arc};

use crate::{
    state::AppState,
    zk::{
        circuit::{
            CIRCUIT_MAX_POLYGON_HASHES as MAX_HASHES, CIRCUIT_MAX_VERTICES as MAX_VERTS,
            CIRCUIT_PRECISION as PREC, PointInMapCircuit, hash_polygon, is_point_in_polygon,
        },
        point_2d::Point2DDec,
    },
};

// ───────── helpers ─────────

fn gps_to_web_mercator(lon_deg: f64, lat_deg: f64) -> (f64, f64) {
    const R: f64 = 6_378_137.0;
    let x = R * lon_deg.to_radians();
    let y = R * ((90.0 + lat_deg).to_radians() / 2.0).tan().ln();
    (x, y)
}

fn current_h3_polygon(
    lon: f64,
    lat: f64,
    res: Resolution,
) -> ([Point2DDec<Fr, PREC>; MAX_VERTS], usize) {
    let cell = h3o::LatLng::new(lat, lon).unwrap().to_cell(res);
    let boundary = cell.boundary();
    let n = boundary.len().min(MAX_VERTS);

    let mut poly = [Point2DDec::<Fr, PREC>::from_f64(0.0, 0.0); MAX_VERTS];
    for (i, ll) in boundary.into_iter().take(n).enumerate() {
        let (x, y) = gps_to_web_mercator(ll.lng(), ll.lat());
        poly[i] = Point2DDec::from_f64(x, y);
    }
    (poly, n)
}

fn hash_cell_boundary(
    poly: &[Point2DDec<Fr, PREC>; MAX_VERTS],
    n: usize,
    cfg: &PoseidonConfig<Fr>,
) -> Fr {
    hash_polygon::<Fr, PREC, MAX_VERTS>(poly, n, cfg)
}

fn hash_map_cells(h3_cells: &[String], cfg: &PoseidonConfig<Fr>) -> Vec<Fr> {
    h3_cells
        .iter()
        .filter_map(|hex| CellIndex::from_str(hex).ok())
        .map(|cell| {
            let boundary = cell.boundary();
            let n = boundary.len().min(MAX_VERTS);
            let mut poly = [Point2DDec::<Fr, PREC>::from_f64(0.0, 0.0); MAX_VERTS];
            for (i, ll) in boundary.into_iter().take(n).enumerate() {
                let (x, y) = gps_to_web_mercator(ll.lng(), ll.lat());
                poly[i] = Point2DDec::from_f64(x, y);
            }
            hash_cell_boundary(&poly, n, cfg)
        })
        .collect()
}

// ───────── request body ─────────
#[derive(Deserialize)]
pub struct ProveRequest {
    pub lat: f64,
    pub lon: f64,
    pub resolution: u8,
    pub h3_map: Vec<String>,
}

// ───────── handler ─────────
#[post("/prove")]
pub async fn prove(
    body: web::Json<ProveRequest>,
    app_state: web::Data<Arc<AppState>>,
) -> Result<impl Responder, actix_web::Error> {
    let cfg = &app_state.poseidon_config;
    let pk = &app_state.pk;

    // 0. resolution
    let res =
        Resolution::try_from(body.resolution).map_err(|_| ErrorBadRequest("invalid resolution"))?;

    // 1. current cell polygon + hash
    let (poly, n) = current_h3_polygon(body.lon, body.lat, res);
    let cell_hash = hash_cell_boundary(&poly, n, cfg);

    // 2. map hashes
    let map_hashes = hash_map_cells(&body.h3_map, cfg);

    // 3. native checks
    let (x, y) = gps_to_web_mercator(body.lon, body.lat);
    let inside_poly =
        is_point_in_polygon::<Fr, PREC, MAX_VERTS>(&Point2DDec::from_f64(x, y), &poly, n);
    let hash_match = map_hashes.iter().any(|h| h == &cell_hash);
    let final_flag = inside_poly && hash_match;

    // 4. build circuit
    let mut pub_hash_arr = [Fr::zero(); MAX_HASHES];
    for (i, h) in map_hashes.iter().take(MAX_HASHES).enumerate() {
        pub_hash_arr[i] = *h;
    }
    let circuit = PointInMapCircuit::<Fr, PREC, MAX_VERTS, MAX_HASHES>::new(
        Point2DDec::from_f64(x, y),
        poly,
        n as u64,
        final_flag,
        pub_hash_arr,
        cfg.clone(),
    );

    // 5. Groth16 proof
    let mut rng: StdRng = SeedableRng::seed_from_u64(0);
    let proof = match Groth16::<Bn254>::prove(pk, circuit, &mut rng) {
        Ok(pr) => pr,
        Err(e) => {
            return Ok(HttpResponse::Ok().json(serde_json::json!({
                "ok": false,
                "err_msg": format!("proof generation failed: {e}")
            })));
        }
    };

    // 6. public inputs
    let mut public_inputs = Vec::<Fr>::new();
    public_inputs.push(if final_flag { Fr::one() } else { Fr::zero() });
    public_inputs.extend_from_slice(&pub_hash_arr);

    // 7. serialise (uncompressed) -> base-64
    let proof_b64 = {
        let mut buf = Vec::new();
        proof.serialize_uncompressed(&mut buf).unwrap();
        B64.encode(buf)
    };
    let publics_b64: Vec<String> = public_inputs
        .iter()
        .map(|f| {
            let mut v = Vec::new();
            f.serialize_uncompressed(&mut v).unwrap();
            B64.encode(v)
        })
        .collect();

    // 8. success JSON
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "ok": true,
        "proof": { "data": proof_b64 },
        "public_inputs": publics_b64
    })))
}
