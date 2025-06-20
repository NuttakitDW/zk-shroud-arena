use actix_web::{HttpResponse, Responder, Result, post, web};
use serde::Deserialize;

use crate::state::AppState;

#[derive(Deserialize)]
pub struct ProveRequest {
    pub lat: f64,
    pub lon: f64,
    pub resolution: u8,
    pub h3_map: Vec<String>,
}

#[post("/prove")]
pub async fn prove(
    body: web::Json<ProveRequest>,
    app_state: web::Data<std::sync::Arc<AppState>>,
) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({}))
}
