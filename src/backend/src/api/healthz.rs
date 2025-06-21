use actix_web::{HttpResponse, Result};

pub async fn healthz() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().body("ok"))
}
