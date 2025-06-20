use ark_ff::PrimeField;
use ark_r1cs_std::prelude::Boolean;
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
    epsilon: Dec<F, PREC>,
) -> bool {
    if num_vertices < 3 {
        return false;
    }

    let mut is_outside_count = 0;
    let neg_epsilon = epsilon.mul_unscaled(Dec {
        val: F::one(),
        neg: true,
    });

    for i in 0..num_vertices {
        let current = &polygon[i];
        let next = &polygon[(i + 1) % num_vertices];

        // d_j = (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1)
        let x2_minus_x1 = next.x.sub(current.x);
        let py_minus_y1 = point.y.sub(current.y);
        let y2_minus_y1 = next.y.sub(current.y);
        let px_minus_x1 = point.x.sub(current.x);

        let a = x2_minus_x1.mul_unscaled(py_minus_y1);
        let b = y2_minus_y1.mul_unscaled(px_minus_x1);
        let d_j = a.sub(b);

        if comp_dec_less_than(&d_j, &neg_epsilon) {
            is_outside_count += 1;
        }
    }

    is_outside_count == 0
}
