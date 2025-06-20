use std::{borrow::Borrow, iter::FilterMap};

use ark_ff::PrimeField;
use ark_r1cs_std::{
    alloc::{AllocVar, AllocationMode},
    fields::{FieldVar, fp::FpVar},
    prelude::{Boolean, ToBitsGadget},
};
use ark_relations::r1cs::{Namespace, SynthesisError};

#[derive(Copy, Clone)]
pub struct Dec<F: PrimeField, const PREC: u32> {
    pub val: F,
    pub neg: bool,
}

impl<F: PrimeField, const PREC: u32> Dec<F, PREC> {
    fn signed_add_u128(a_neg: bool, a_mag: u128, b_neg: bool, b_mag: u128) -> (bool, u128) {
        if a_neg == b_neg {
            (a_neg, a_mag.saturating_add(b_mag))
        } else {
            if a_mag >= b_mag {
                (a_neg, a_mag - b_mag)
            } else {
                (b_neg, b_mag - a_mag)
            }
        }
    }

    fn u128_from_field_element(f: F) -> u128 {
        let bigint = f.into_bigint();
        let limbs = bigint.as_ref();

        match limbs {
            [lo] => *lo as u128,
            [lo, hi, ..] => (*lo as u128) | ((*hi as u128) << 64),
            _ => 0,
        }
    }

    pub fn add(self, rhs: Self) -> Self {
        let a_u128 = Self::u128_from_field_element(self.val);
        let b_u128 = Self::u128_from_field_element(rhs.val);

        let (res_neg, res_val_u128) = Self::signed_add_u128(self.neg, a_u128, rhs.neg, b_u128);
        let res_neg = if res_val_u128 == 0 { false } else { res_neg };

        Self {
            val: F::from(res_val_u128),
            neg: res_neg,
        }
    }

    pub fn sub(self, rhs: Self) -> Self {
        let mut r_negated = rhs;
        if rhs.val == F::zero() {
            r_negated.neg = false;
        } else {
            r_negated.neg = !rhs.neg;
        }
        self.add(r_negated)
    }

    pub fn mul_unscaled(self, rhs: Self) -> Self {
        let result_val = self.val * rhs.val;
        let result_neg = if result_val.is_zero() {
            false
        } else {
            self.neg ^ rhs.neg
        };

        Self {
            val: result_val,
            neg: result_neg,
        }
    }
}

pub struct DecVar<F: PrimeField, const PREC: u32> {
    pub val: FpVar<F>,
    pub neg: Boolean<F>,
}

fn cst<F: PrimeField>(plus: bool) -> FpVar<F> {
    if plus {
        FpVar::constant(F::one())
    } else {
        FpVar::constant(-F::one())
    }
}

impl<F: PrimeField, const PREC: u32> AllocVar<Dec<F, PREC>, F> for DecVar<F, PREC> {
    fn new_variable<T: Borrow<Dec<F, PREC>>>(
        cs: impl Into<Namespace<F>>,
        f: impl FnOnce() -> Result<T, SynthesisError>,
        mode: AllocationMode,
    ) -> Result<Self, SynthesisError> {
        let ns = cs.into();
        let val = f()?;
        let borrowed_val = val.borrow();
        Ok(Self {
            val: FpVar::new_variable(ns.clone(), || Ok(borrowed_val.val), mode)?,
            neg: Boolean::new_variable(ns, || Ok(borrowed_val.neg), mode)?,
        })
    }
}

impl<F: PrimeField, const PREC: u32> DecVar<F, PREC> {
    pub fn add(&self, rhs: &Self) -> Result<Self, SynthesisError> {
        let s1 = Boolean::select(&self.neg, &cst(false), &cst(true))?;
        let s2 = Boolean::select(&rhs.neg, &cst(false), &cst(true))?;

        let sum_val = self.val.clone() * s1 + rhs.val.clone() * s2;
        let sum_bits = sum_val.to_bits_le()?;
        let final_sign_bit = sum_bits
            .last()
            .cloned()
            .ok_or(SynthesisError::Unsatisfiable)?;
        let negated_sum_val = sum_val.negate()?;
        let abs_mag = Boolean::select(&final_sign_bit, &negated_sum_val, &sum_val)?;
        Ok(Self {
            val: abs_mag,
            neg: final_sign_bit,
        })
    }
}
