use actix_web::{App, HttpServer, middleware::DefaultHeaders};
use ark_bn254::Fr;
use ark_crypto_primitives::sponge::poseidon::{PoseidonConfig, find_poseidon_ark_and_mds};
use ark_ff::PrimeField;

use crate::{
    keys::load_or_gen_keys,
    zk::circuit::{CIRCUIT_MAX_POLYGON_HASHES, CIRCUIT_MAX_VERTICES, CIRCUIT_PRECISION},
};

mod api;
mod keys;
mod state;
mod zk;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let (ark, mds) = find_poseidon_ark_and_mds::<Fr>(Fr::MODULUS_BIT_SIZE as u64, 3, 8, 31, 0);
    let poseidon_config = PoseidonConfig {
        full_rounds: 8,
        partial_rounds: 31,
        alpha: 17,
        ark,
        mds,
        rate: 2,
        capacity: 1,
    };

    let (pk, pvk) =
        load_or_gen_keys::<CIRCUIT_PRECISION, CIRCUIT_MAX_VERTICES, CIRCUIT_MAX_POLYGON_HASHES>(
            &poseidon_config,
        );

    let shared = state::AppState::init(pk, pvk, poseidon_config).expect("init state");

    ///////////////////////////////////////////////////////////////////////////////////////////////////

    println!("Starting server at 8080");
    HttpServer::new(move || {
        App::new()
            .app_data(shared.clone())
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
