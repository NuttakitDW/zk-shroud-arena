// cargo run --release --bin vk_to_snarkjs -- \
//           --vk  ../verifying_key.bin \
//           --out ../vkey.json

use std::{fs, io::Cursor, path::PathBuf};

use ark_bn254::{Bn254, Fq, Fq2, Fq12};
use ark_ec::pairing::Pairing;
use ark_groth16::VerifyingKey;
use ark_serialize::CanonicalDeserialize;
use clap::Parser;
use serde::Serialize;

#[derive(Parser)]
struct Cmd {
    /// raw verifying_key.bin produced by your backend
    #[clap(long)]
    vk: PathBuf,
    /// output path (snarkjs-compatible)
    #[clap(long)]
    out: PathBuf,
}

/* ---------- helpers --------------------------------------------------- */

fn fq_to_str(f: &Fq) -> String {
    use ark_ff::PrimeField;
    f.into_bigint().to_string()
}

fn fq2_to_arr(f: &Fq2) -> [String; 2] {
    [fq_to_str(&f.c1), fq_to_str(&f.c0)] // imag first, real second
}

fn g1_to_arr(p: &<Bn254 as Pairing>::G1Affine) -> [String; 2] {
    [fq_to_str(&p.x), fq_to_str(&p.y)]
}
fn g2_to_arr(p: &<Bn254 as Pairing>::G2Affine) -> [[String; 2]; 2] {
    // snarkjs expects (imag, real) ordering
    [
        [fq_to_str(&p.x.c1), fq_to_str(&p.x.c0)],
        [fq_to_str(&p.y.c1), fq_to_str(&p.y.c0)],
    ]
}

/* ---------- snarkjs VK structure ------------------------------------- */

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VKeyJs {
    protocol: &'static str,
    curve: &'static str,
    n_public: usize,

    vk_alpha_1: [String; 2],
    vk_beta_2: [[String; 2]; 2],
    vk_gamma_2: [[String; 2]; 2],
    vk_delta_2: [[String; 2]; 2],

    vk_alphabeta_12: [[[String; 2]; 2]; 3],

    #[serde(rename = "IC")]
    ic: Vec<[String; 2]>,
}

/* ---------- main ------------------------------------------------------ */

fn main() -> anyhow::Result<()> {
    let cmd = Cmd::parse();

    /* 1. read raw verifying key ---------------------------------------- */
    let vk_bytes = fs::read(&cmd.vk)?;
    let vk: VerifyingKey<Bn254> =
        VerifyingKey::deserialize_uncompressed(&mut Cursor::new(vk_bytes))
            .map_err(|e| anyhow::anyhow!("deserialise vk: {e}"))?;

    /* 2. compute α·β (needed only now) ---------------------------------- */
    let alphabeta: Fq12 = Bn254::pairing(&vk.alpha_g1, &vk.beta_g2).0;

    // coeffs are (c0.c0, c0.c1, c0.c2) – each is Fq2
    let ab_coeffs = [
        [
            fq2_to_arr(&alphabeta.c0.c0), // X-imag / X-real
            fq2_to_arr(&alphabeta.c1.c0), // Y-imag / Y-real
        ],
        [fq2_to_arr(&alphabeta.c0.c1), fq2_to_arr(&alphabeta.c1.c1)],
        [fq2_to_arr(&alphabeta.c0.c2), fq2_to_arr(&alphabeta.c1.c2)],
    ];

    /* 3. build snarkjs object ------------------------------------------ */
    let vkey_js = VKeyJs {
        protocol: "groth16",
        curve: "bn128",
        n_public: vk.gamma_abc_g1.len() - 1,

        vk_alpha_1: g1_to_arr(&vk.alpha_g1),
        vk_beta_2: g2_to_arr(&vk.beta_g2),
        vk_gamma_2: g2_to_arr(&vk.gamma_g2),
        vk_delta_2: g2_to_arr(&vk.delta_g2),

        vk_alphabeta_12: ab_coeffs,
        ic: vk.gamma_abc_g1.iter().map(g1_to_arr).collect(),
    };

    /* 4. write ---------------------------------------------------------- */
    let json = serde_json::to_string_pretty(&vkey_js)?;
    fs::write(&cmd.out, json)?;
    println!("✅ wrote {}", cmd.out.display());
    Ok(())
}
