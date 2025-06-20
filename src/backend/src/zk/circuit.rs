use std::cmp::Ordering;

use ark_crypto_primitives::sponge::{
    Absorb, CryptographicSponge,
    poseidon::{PoseidonConfig, PoseidonSponge},
};
use ark_ff::PrimeField;
use ark_r1cs_std::{
    fields::{FieldVar, fp::FpVar},
    prelude::Boolean,
};
use ark_relations::r1cs::SynthesisError;

use crate::zk::{
    fixed_point_decimal::{Dec, DecVar},
    point_2d::{Point2DDec, Point2DDecVar},
};

pub const CIRCUIT_MAX_VERTICES: usize = 6;
pub const CIRCUIT_PRECISION: u32 = 8;
pub const CIRCUIT_MAX_POLYGON_HASHES: usize = 1024;

// compare l < r
pub fn comp_dec_less_than<F: PrimeField, const PREC: u32>(
    l: &Dec<F, PREC>,
    r: &Dec<F, PREC>,
) -> bool {
    if l.neg && !r.neg {
        true
    } else if !l.neg && r.neg {
        false
    } else if !l.neg && !r.neg {
        l.val < r.val
    } else {
        l.val > r.val
    }
}

// compare l < r
pub fn comp_dec_less_than_gadget<F: PrimeField, const PREC: u32>(
    l: &DecVar<F, PREC>,
    r: &DecVar<F, PREC>,
) -> Result<Boolean<F>, SynthesisError> {
    let case1 = &l.neg & &!r.neg.clone();

    let case3_cond = &!l.neg.clone() & &!r.neg.clone();
    let case3_val_lt = l
        .val
        .is_cmp_unchecked(&r.val, core::cmp::Ordering::Less, false)?;
    let case3 = &case3_cond & &case3_val_lt;

    let case4_cond = &l.neg & &r.neg;
    let case4_val_gt = l
        .val
        .is_cmp_unchecked(&r.val, core::cmp::Ordering::Greater, false)?;
    let case4 = &case4_cond & &case4_val_gt;

    Ok(case1 | case3 | case4)
}

pub fn is_point_in_polygon<F: PrimeField, const PREC: u32, const MAX_VERTICES: usize>(
    point: &Point2DDec<F, PREC>,
    polygon: &[Point2DDec<F, PREC>; MAX_VERTICES],
    num_vertices: usize,
) -> bool {
    if num_vertices < 3 {
        return false;
    }

    let mut outside_count = 0;
    let zero_dec = Dec::<F, PREC> {
        val: F::zero(),
        neg: false,
    };

    for i in 0..num_vertices {
        let current = &polygon[i];
        let next = &polygon[(i + 1) % num_vertices];

        // d_j = (x2-x1)*(py-y1) − (y2-y1)*(px-x1)
        let x2_x1 = next.x.sub(current.x);
        let py_y1 = point.y.sub(current.y);
        let y2_y1 = next.y.sub(current.y);
        let px_x1 = point.x.sub(current.x);

        let a = x2_x1.mul_unscaled(py_y1);
        let b = y2_y1.mul_unscaled(px_x1);
        let d_j = a.sub(b);

        if comp_dec_less_than(&d_j, &zero_dec) {
            outside_count += 1;
        }
    }

    outside_count == 0
}

pub fn is_point_in_polygon_gadget<F: PrimeField, const PREC: u32, const MAX_VERTICES: usize>(
    point: &Point2DDecVar<F, PREC>,
    polygon: &[Point2DDecVar<F, PREC>; MAX_VERTICES],
    num_vertices: &FpVar<F>,
) -> Result<Boolean<F>, SynthesisError> {
    let zero_f = FpVar::<F>::zero();
    let one_f = FpVar::<F>::constant(F::one());
    let three_f = FpVar::<F>::constant(F::from(3u64));

    let zero_dec = DecVar::<F, PREC> {
        val: zero_f.clone(),
        neg: Boolean::constant(false),
    };

    let mut outside_count = zero_f.clone();

    for i in 0..MAX_VERTICES {
        let i_const = FpVar::<F>::constant(F::from(i as u64));
        let active_i = i_const.is_cmp_unchecked(num_vertices, Ordering::Less, false)?;

        let current = &polygon[i];
        let next = &polygon[(i + 1) % MAX_VERTICES];

        // d_j = (x2-x1)*(py-y1) − (y2-y1)*(px-x1)
        let x2_x1 = next.x.sub(&current.x)?;
        let py_y1 = point.y.sub(&current.y)?;
        let y2_y1 = next.y.sub(&current.y)?;
        let px_x1 = point.x.sub(&current.x)?;

        let a = x2_x1.mul_unscaled(&py_y1)?;
        let b = y2_y1.mul_unscaled(&px_x1)?;
        let d_j = a.sub(&b)?;

        let is_outside = comp_dec_less_than_gadget(&d_j, &zero_dec)?;
        let inc_flag = active_i & is_outside;

        let inc_val = Boolean::select(&inc_flag, &one_f, &zero_f)?;
        outside_count = &outside_count + &inc_val;
    }

    let valid_n = num_vertices.is_cmp_unchecked(&three_f, Ordering::Greater, false)?;
    let outside_zero = outside_count.is_zero()?;
    Ok(valid_n & outside_zero)
}

pub fn hash_polygon<F: PrimeField + Absorb, const PREC: u32, const MAX_VERTICES: usize>(
    polygon: &[Point2DDec<F, PREC>; MAX_VERTICES],
    num_vertices: usize,
    cfg: &PoseidonConfig<F>,
) -> F {
    assert!(num_vertices <= MAX_VERTICES, "num_vertices out of range");
    let mut sponge = PoseidonSponge::<F>::new(cfg);

    let len_elem = F::from(num_vertices as u64);
    sponge.absorb(&len_elem);

    for i in 0..num_vertices {
        let v = &polygon[i];

        sponge.absorb(&v.x.val);
        let x_sign: F = if v.x.neg { F::one() } else { F::zero() };
        sponge.absorb(&x_sign);

        sponge.absorb(&v.y.val);
        let y_sign: F = if v.y.neg { F::one() } else { F::zero() };
        sponge.absorb(&y_sign);
    }

    sponge.squeeze_field_elements(1)[0]
}
