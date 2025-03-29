use chrono::{DateTime, Utc};
use rust_decimal::Decimal;

use super::currency::Currency;

pub enum Event {
    Acquisition {
        currency: Currency,
        amount: Decimal,
        unit_price_eur: Decimal,
        timestamp: DateTime<Utc>,
        fees_eur: Decimal,
    },
    Disposal {
        currency: Currency,
        amount: Decimal,
        unit_price_eur: Decimal,
        timestamp: DateTime<Utc>,
        fees_eur: Decimal,
    },
    TransferKnownFrom {
        from: Currency,
        to: Currency,
        amount_from: Decimal,
        amount_to: Decimal,
        unit_price_eur_from: Decimal,
        timestamp: DateTime<Utc>,
        fees_eur: Decimal,
    },
    TransferKnownTo {
        from: Currency,
        to: Currency,
        amount_from: Decimal,
        amount_to: Decimal,
        unit_price_eur_to: Decimal,
        timestamp: DateTime<Utc>,
        fees_eur: Decimal,
    },
    TransferUnknown {
        from: Currency,
        to: Currency,
        amount_from: Decimal,
        amount_to: Decimal,
        timestamp: DateTime<Utc>,
        fees_eur: Decimal,
    },
}
