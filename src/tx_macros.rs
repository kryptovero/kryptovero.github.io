#[macro_export]
macro_rules! tx {
    (($year:expr, $month:expr, $day:expr), $from:expr, $to:expr, $amount:expr, $price:expr) => {
        transaction::Transaction::new(
            transaction::Currency::new($from),
            transaction::Currency::new($to),
            Decimal::from($amount),
            Decimal::from($price),
            date!($year, $month, $day),
        )
    };
}

#[macro_export]
macro_rules! buy {
    (($year:expr, $month:expr, $day:expr), $to:expr, $amount:expr, $price:expr) => {
        tx!(($year, $month, $day), "EUR", $to, $amount, $price)
    };
}

#[macro_export]
macro_rules! change {
    (($year:expr, $month:expr, $day:expr), ($from:expr, $from_amount:expr), ($to:expr, $to_amount:expr, $to_price:expr)) => {
        // TODO: This is not correct, the transaction model needs some changes to support this
        tx!(($year, $month, $day), $from, $to, $from_amount, $to_price)
    };
}
#[macro_export]
macro_rules! change2 {
    (($year:expr, $month:expr, $day:expr), ($from:expr, $from_amount:expr, $from_price:expr), ($to:expr, $to_amount:expr)) => {
        // TODO: This is not correct, the transaction model needs some changes to support this
        tx!(($year, $month, $day), $from, $to, $from_amount, $from_price)
    };
}
#[macro_export]
macro_rules! change_unknown {
    (($year:expr, $month:expr, $day:expr), ($from:expr, $from_amount:expr), ($to:expr, $to_amount:expr)) => {
        // TODO: This is not correct, the transaction model needs some changes to support this
        tx!(($year, $month, $day), $from, $to, $from_amount, $to_amount)
    };
}

#[macro_export]
macro_rules! sell {
    (($year:expr, $month:expr, $day:expr), $from:expr, $amount:expr, $price:expr) => {
        tx!(($year, $month, $day), $from, "EUR", $amount, $price)
    };
}
