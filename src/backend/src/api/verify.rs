use actix_web::{HttpResponse, Responder, post, web};
use serde::Deserialize;

use crate::state::AppState;

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

#[post("/verify")]
pub async fn verify(
    body: web::Json<VerifyRequest>,
    app_state: web::Data<std::sync::Arc<AppState>>,
) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({}))
}
