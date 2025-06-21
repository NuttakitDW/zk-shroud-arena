use std::{io::Result, sync::Arc};

use actix_web::web::Data;
use ark_bn254::{Bn254, Fr};
use ark_crypto_primitives::sponge::poseidon::PoseidonConfig;
use ark_groth16::{PreparedVerifyingKey, ProvingKey, VerifyingKey};

pub struct AppState {
    pub pk: ProvingKey<Bn254>,
    pub pvk: PreparedVerifyingKey<Bn254>,
    pub poseidon_config: PoseidonConfig<Fr>,
    pub transformer_from: String,
    pub transformer_to: String,
}

impl AppState {
    pub fn init(
        pk: ProvingKey<Bn254>,
        pvk: PreparedVerifyingKey<Bn254>,
        poseidon_config: PoseidonConfig<Fr>,
    ) -> Result<Data<Arc<Self>>> {
        Ok(Data::new(Arc::new(Self {
            pk,
            pvk,
            poseidon_config,
            transformer_from: "EPSG:4326".to_string(),
            transformer_to: "EPSG:3857".to_string(),
        })))
    }
}
