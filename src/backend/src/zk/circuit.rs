use std::cmp::Ordering;

use ark_crypto_primitives::sponge::{
    Absorb, CryptographicSponge,
    constraints::CryptographicSpongeVar,
    poseidon::{PoseidonConfig, PoseidonSponge},
};
use ark_ff::PrimeField;
use ark_r1cs_std::{
    boolean::Boolean,
    fields::{FieldVar, fp::FpVar},
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

    sponge.absorb(&F::from(num_vertices as u64));

    for i in 0..MAX_VERTICES {
        if i < num_vertices {
            let v = &polygon[i];

            sponge.absorb(&v.x.val);
            sponge.absorb(&if v.x.neg { F::one() } else { F::zero() });

            sponge.absorb(&v.y.val);
            sponge.absorb(&if v.y.neg { F::one() } else { F::zero() });
        } else {
            sponge.absorb(&F::zero()); // x_val
            sponge.absorb(&F::zero()); // x_sign
            sponge.absorb(&F::zero()); // y_val
            sponge.absorb(&F::zero()); // y_sign
        }
    }

    sponge.squeeze_field_elements(1)[0]
}

pub fn hash_polygon_gadget<F: PrimeField + Absorb, const PREC: u32, const MAX_VERTICES: usize>(
    polygon: &[Point2DDecVar<F, PREC>; MAX_VERTICES],
    num_vertices: &FpVar<F>,
    cfg: &PoseidonConfig<F>,
) -> Result<FpVar<F>, SynthesisError> {
    use ark_crypto_primitives::sponge::poseidon::constraints::PoseidonSpongeVar;
    use ark_r1cs_std::{boolean::Boolean, prelude::R1CSVar};
    use core::cmp::Ordering;

    let cs = num_vertices.cs();
    let one = FpVar::<F>::constant(F::one());
    let zero = FpVar::<F>::zero();

    let mut sponge = PoseidonSpongeVar::<F>::new(cs, cfg);

    sponge.absorb(num_vertices)?;

    for i in 0..MAX_VERTICES {
        let i_const = FpVar::<F>::constant(F::from(i as u64));
        let active_i = i_const.is_cmp_unchecked(num_vertices, Ordering::Less, false)?;

        let flag_f = Boolean::select(&active_i, &one, &zero)?;

        let v = &polygon[i];

        let x_val = &v.x.val * &flag_f;
        let x_sign = Boolean::select(&v.x.neg, &one, &zero)? * &flag_f;
        sponge.absorb(&x_val)?;
        sponge.absorb(&x_sign)?;

        let y_val = &v.y.val * &flag_f;
        let y_sign = Boolean::select(&v.y.neg, &one, &zero)? * &flag_f;
        sponge.absorb(&y_val)?;
        sponge.absorb(&y_sign)?;
    }

    Ok(sponge.squeeze_field_elements(1)?[0].clone())
}

#[cfg(test)]
mod tests {
    use super::*;

    // ---------- field & Poseidon config ----------
    use ark_bn254::Fr;
    use ark_crypto_primitives::sponge::poseidon::find_poseidon_ark_and_mds;

    // ---------- gadgets / R1CS ----------
    use ark_r1cs_std::{R1CSVar, alloc::AllocVar};
    use ark_relations::r1cs::ConstraintSystem;

    // ---------- rand 0.9 (no deprecated names) ----------
    use rand::{Rng, rng, rngs::ThreadRng};

    type F = Fr;
    const MAX: usize = CIRCUIT_MAX_VERTICES;
    const PREC: u32 = CIRCUIT_PRECISION;

    // Poseidon parameters: width 3, α = 17, 8 full + 31 partial rounds
    fn poseidon_cfg() -> PoseidonConfig<Fr> {
        let (ark, mds) = find_poseidon_ark_and_mds::<Fr>(Fr::MODULUS_BIT_SIZE as u64, 3, 8, 31, 0);

        PoseidonConfig {
            full_rounds: 8,
            partial_rounds: 31,
            alpha: 17,
            ark,
            mds,
            rate: 2,
            capacity: 1,
        }
    }

    // ------- helper: random convex-ish polygon -----------------
    fn random_polygon(rng: &mut ThreadRng, n: usize) -> [Point2DDec<F, PREC>; MAX] {
        debug_assert!(n <= MAX);
        let mut arr = core::array::from_fn(|_| Point2DDec::from_f64(0.0, 0.0));
        for i in 0..n {
            let x = rng.random_range(-100.0..100.0);
            let y = rng.random_range(-100.0..100.0);
            arr[i] = Point2DDec::from_f64(x, y);
        }
        arr
    }

    // ------- helper: allocate polygon var ----------------------
    fn alloc_polygon_var<const P: u32>(
        cs: ark_relations::r1cs::ConstraintSystemRef<F>,
        poly: &[Point2DDec<F, P>; MAX],
    ) -> [Point2DDecVar<F, P>; MAX] {
        core::array::from_fn(|i| {
            let p = &poly[i];
            Point2DDecVar {
                x: DecVar::new_witness(cs.clone(), || Ok(p.x)).unwrap(),
                y: DecVar::new_witness(cs.clone(), || Ok(p.y)).unwrap(),
            }
        })
    }

    // ------- helper: allocate single point var -----------------
    fn alloc_point_var<const P: u32>(
        cs: ark_relations::r1cs::ConstraintSystemRef<F>,
        p: &Point2DDec<F, P>,
    ) -> Point2DDecVar<F, P> {
        Point2DDecVar {
            x: DecVar::new_witness(cs.clone(), || Ok(p.x)).unwrap(),
            y: DecVar::new_witness(cs, || Ok(p.y)).unwrap(),
        }
    }

    // --------------- round-trip test ----------------------------
    #[test]
    fn helpers_match_bn254() {
        let mut rng: ThreadRng = rng();
        let cfg = poseidon_cfg();

        for _ in 0..8 {
            // random vertex count 3‥=MAX
            let n = rng.random_range(3..=MAX);
            let poly = random_polygon(&mut rng, n);

            let point = {
                let x = rng.random_range(-50.0..50.0);
                let y = rng.random_range(-50.0..50.0);
                Point2DDec::from_f64(x, y)
            };

            // ---------- native ----------
            let inside_native = is_point_in_polygon::<F, PREC, MAX>(&point, &poly, n);
            let hash_native = hash_polygon::<F, PREC, MAX>(&poly, n, &cfg);

            // ---------- gadget ----------
            let cs = ConstraintSystem::<F>::new_ref();

            let n_var = FpVar::<F>::new_witness(cs.clone(), || Ok(F::from(n as u64))).unwrap();
            let poly_var = alloc_polygon_var::<PREC>(cs.clone(), &poly);
            let point_var = alloc_point_var::<PREC>(cs.clone(), &point);

            let inside_gadget =
                is_point_in_polygon_gadget::<F, PREC, MAX>(&point_var, &poly_var, &n_var).unwrap();

            let hash_gadget = hash_polygon_gadget::<F, PREC, MAX>(&poly_var, &n_var, &cfg).unwrap();

            // compare
            assert_eq!(inside_native, inside_gadget.value().unwrap());
            assert_eq!(hash_native, hash_gadget.value().unwrap());
            assert!(cs.is_satisfied().unwrap());
        }
    }
}
