use chrono::{DateTime, Utc};
use rust_decimal::Decimal;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Currency(String);

impl Currency {
    pub fn new(value: &str) -> Self {
        Self(value.to_string())
    }

    pub fn from(value: &str) -> Self {
        Self::new(value)
    }
}

#[derive(Clone)]
pub struct Transaction {
    from: Currency,
    to: Currency,
    amount: Decimal,
    price: Decimal,
    date: DateTime<Utc>,
}

impl Transaction {
    pub fn new(
        from: Currency,
        to: Currency,
        amount: Decimal,
        price: Decimal,
        date: DateTime<Utc>,
    ) -> Self {
        Self {
            from,
            to,
            amount,
            price,
            date,
        }
    }
}
