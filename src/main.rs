use std::collections::HashMap;

use chrono::{DateTime, Datelike, Utc};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use transaction::{Currency, Transaction};
mod date_macros;
mod transaction;
mod tx_macros;

fn main() {
    println!("Hello, world!");
}

#[derive(Clone)]
struct TaxCalculator {
    tax_rows: Vec<TaxRow>,
}

impl TaxCalculator {
    fn new() -> Self {
        Self {
            tax_rows: Vec::new(),
        }
    }

    fn tx(&mut self, tx: Transaction) {
        unimplemented!()
    }

    pub fn tax(&self, year: i32) -> Decimal {
        self.tax_rows
            .iter()
            .filter(|row| row.date.year() == year)
            .map(|row| row.tax_change)
            .sum()
    }

    pub fn state(&self) -> State {
        unimplemented!()
    }
}

struct State {
    currencies: HashMap<Currency, Vec<Amount>>,
}

#[derive(Debug, Eq, PartialEq)]
struct Amount {
    amount: Decimal,
    purchase_price: Decimal,
    purchase_date: DateTime<Utc>,
}

impl Amount {
    fn new(purchase_date: DateTime<Utc>, amount: Decimal, purchase_price: Decimal) -> Self {
        Self {
            amount,
            purchase_price,
            purchase_date,
        }
    }
}
#[derive(Clone)]
struct TaxRow {
    tax_change: Decimal,
    date: DateTime<Utc>,
}

mod tests;
