use std::cmp::Ordering;

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;

use super::currency::Currency;
use super::lot::Lot;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub enum Account {
    Fiat { currency: Currency, id: String },
    Crypto(Lot),
}

impl Account {
    pub fn crypto_timestamp<'a>(&'a self) -> &'a DateTime<Utc> {
        let Account::Crypto(Lot { timestamp, .. }) = self else {
            panic!("Expected crypto account");
        };
        timestamp
    }

    pub fn crypto_unit_price_eur(&self) -> &Decimal {
        let Account::Crypto(Lot { unit_price_eur, .. }) = self else {
            panic!("Expected crypto account");
        };
        unit_price_eur
    }

    pub fn code(&self) -> &str {
        self.currency().code.as_str()
    }

    pub fn currency(&self) -> &Currency {
        match self {
            Account::Fiat { currency, .. } => currency,
            Account::Crypto(lot) => &lot.currency,
        }
    }

    pub fn precision(&self) -> u32 {
        match self {
            Account::Fiat { currency, .. } => currency.precision,
            Account::Crypto(lot) => lot.currency.precision,
        }
    }
}

impl PartialOrd for Account {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for Account {
    fn cmp(&self, other: &Self) -> Ordering {
        self.crypto_timestamp().cmp(other.crypto_timestamp())
    }
}
