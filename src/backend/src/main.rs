use actix_web::{App, HttpServer, middleware::DefaultHeaders};

mod api;
mod state;
mod zk;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Starting server at 8080");
    HttpServer::new(move || {
        App::new()
            .wrap(
                DefaultHeaders::new()
                    .add(("Access-Control-Allow-Origin", "*"))
                    .add(("Access-Control-Allow-Methods", "GET, POST, OPTIONS"))
                    .add(("Access-Control-Allow-Headers", "Content-Type")),
            )
            .configure(api::config)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
