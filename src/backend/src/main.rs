use actix_web::{App, HttpServer, middleware::DefaultHeaders};
use ark_bn254::{Bn254, Fr};
use ark_crypto_primitives::{
    snark::SNARK,
    sponge::poseidon::{PoseidonConfig, find_poseidon_ark_and_mds},
};
use ark_ff::PrimeField;
use ark_ff::Zero;
use ark_groth16::{Groth16, PreparedVerifyingKey, ProvingKey, prepare_verifying_key};
use ark_std::rand::SeedableRng;
use ark_std::rand::rngs::StdRng;

use crate::zk::{
    circuit::CIRCUIT_MAX_POLYGON_HASHES, circuit::CIRCUIT_MAX_VERTICES, circuit::CIRCUIT_PRECISION,
    circuit::PointInMapCircuit, point_2d::Point2DDec,
};

mod api;
mod state;
mod zk;

fn generate_point_in_map_keys<const PREC: u32, const MAX_VERTS: usize, const MAX_HASHES: usize>(
    poseidon_cfg: PoseidonConfig<Fr>,
) -> (ProvingKey<Bn254>, PreparedVerifyingKey<Bn254>) {
    /* dummy circuit (all zeros) */
    let zero_pt = Point2DDec::<Fr, PREC>::from_f64(0.0, 0.0);
    let zero_poly = core::array::from_fn(|_| zero_pt);
    let circuit = PointInMapCircuit::<Fr, PREC, MAX_VERTS, MAX_HASHES>::new(
        zero_pt,
        zero_poly,
        0,
        false,
        [Fr::zero(); MAX_HASHES],
        poseidon_cfg.clone(),
    );

    /* RNG compatible with arkworks (rand 0.8) */
    let mut rng = StdRng::seed_from_u64(0u64);

    let (pk, vk) =
        Groth16::<Bn254>::circuit_specific_setup(circuit, &mut rng).expect("setup failed");
    (pk, prepare_verifying_key(&vk))
}

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

    let (pk, pvk) = generate_point_in_map_keys::<
        CIRCUIT_PRECISION,
        CIRCUIT_MAX_VERTICES,
        CIRCUIT_MAX_POLYGON_HASHES,
    >(poseidon_config.clone());

    let shared = state::AppState::init(pk, pvk, poseidon_config).expect("init state");

    ///////////////////////////////////////////////////////////////////////////////////////////////////

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
