// ───────────── parameters on disk ────────────────────────────
use std::{fs, path::Path};

use ark_bn254::{Bn254, Fr};
use ark_crypto_primitives::{snark::SNARK, sponge::poseidon::PoseidonConfig};
use ark_ff::Zero;
use ark_groth16::{Groth16, PreparedVerifyingKey, ProvingKey, prepare_verifying_key};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use ark_std::rand::{SeedableRng, rngs::StdRng};

use crate::zk::{circuit::PointInMapCircuit, point_2d::Point2DDec};

const PARAM_DIR: &str = "./params";
const PK_PATH: &str = "./params/proving_key.bin";
const VK_PATH: &str = "./params/verifying_key.bin";

fn read_keys_from_disk() -> Option<(ProvingKey<Bn254>, PreparedVerifyingKey<Bn254>)> {
    if !(Path::new(PK_PATH).exists() && Path::new(VK_PATH).exists()) {
        return None;
    }

    println!("🗝️  Loading keys from {PARAM_DIR} …");

    let pk_bytes = fs::read(PK_PATH).ok()?;
    let vk_bytes = fs::read(VK_PATH).ok()?;

    let pk = ProvingKey::<Bn254>::deserialize_uncompressed(&*pk_bytes).ok()?;
    let vk = ark_groth16::VerifyingKey::<Bn254>::deserialize_uncompressed(&*vk_bytes).ok()?;

    Some((pk, prepare_verifying_key(&vk)))
}

fn write_keys_to_disk(pk: &ProvingKey<Bn254>, vk: &ark_groth16::VerifyingKey<Bn254>) {
    fs::create_dir_all(PARAM_DIR).expect("create param dir");

    let mut buf = Vec::new();
    pk.serialize_uncompressed(&mut buf).unwrap();
    fs::write(PK_PATH, &buf).expect("write pk");

    buf.clear();
    vk.serialize_uncompressed(&mut buf).unwrap();
    fs::write(VK_PATH, &buf).expect("write vk");

    println!("🗝️  Groth16 keys written to {PARAM_DIR}");
}

// ───────────── load-or-generate helper  ───────────────────────
pub fn load_or_gen_keys<const PREC: u32, const MAX_VERTS: usize, const MAX_HASHES: usize>(
    poseidon_cfg: &PoseidonConfig<Fr>,
) -> (ProvingKey<Bn254>, PreparedVerifyingKey<Bn254>) {
    if let Some(keys) = read_keys_from_disk() {
        return keys;
    }

    println!("🗝️  Keys not found – running circuit-specific setup (this is one-off).");

    // ---- dummy circuit identical to the one used previously ----
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

    let mut rng: StdRng = SeedableRng::seed_from_u64(0);
    let (pk, vk) =
        Groth16::<Bn254>::circuit_specific_setup(circuit, &mut rng).expect("setup failed");

    write_keys_to_disk(&pk, &vk);
    (pk, prepare_verifying_key(&vk))
}
