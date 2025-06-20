use ark_ff::PrimeField;
use ark_r1cs_std::{fields::fp::FpVar, prelude::Boolean};

pub struct Dec<F: PrimeField, const PREC: u32> {
    pub val: F,
    pub neg: bool,
}

impl<F: PrimeField, const PREC: u32> Dec<F, PREC> {}

pub struct DecVar<F: PrimeField, const PREC: u32> {
    pub val: FpVar<F>,
    pub neg: Boolean<F>,
}

impl<F: PrimeField, const PREC: u32> DecVar<F, PREC> {}
