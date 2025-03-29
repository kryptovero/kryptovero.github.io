use chrono::{DateTime, Utc};
use rust_decimal::Decimal;

use super::currency::Currency;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Lot {
    pub(crate) currency: Currency,
    pub(crate) unit_price_eur: Decimal,
    pub(crate) timestamp: DateTime<Utc>,
}
