use std::{fs, io::Cursor};

use ark_bn254::Bn254;
use ark_groth16::{Groth16, VerifyingKey};
use ark_serialize::CanonicalDeserialize;
use arkworks_solidity_verifier::SolidityVerifier;

fn main() {
    /* read the raw vk.bin ------------------------------------------------ */
    let vk_bytes = std::fs::read("../verifying_key.bin").unwrap();
    let vk: VerifyingKey<Bn254> =
        VerifyingKey::deserialize_uncompressed(&mut Cursor::new(vk_bytes)).unwrap();

    /* generate Solidity verifier ---------------------------------------- */
    let solidity_code: String = Groth16::export(&vk);
    fs::write("Verifier.sol", solidity_code).unwrap();
}
