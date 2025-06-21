use ark_ff::PrimeField;

use crate::zk::fixed_point_decimal::{Dec, DecVar};

#[derive(Clone, Copy)]
pub struct Point2DDec<F: PrimeField, const PREC: u32> {
    pub x: Dec<F, PREC>,
    pub y: Dec<F, PREC>,
}

impl<F: PrimeField, const PREC: u32> Point2DDec<F, PREC> {
    pub fn from_f64(x: f64, y: f64) -> Self {
        Self {
            x: Dec::from_f64(x),
            y: Dec::from_f64(y),
        }
    }
}

pub struct Point2DDecVar<F: PrimeField, const PREC: u32> {
    pub x: DecVar<F, PREC>,
    pub y: DecVar<F, PREC>,
}
