use std::rc::Rc;

use rust_decimal::Decimal;

use super::{account::Account, direction::Direction};

#[derive(Debug)]
pub struct Transaction {
    pub direction: Direction,
    pub amount: Decimal,
    pub account: Rc<Account>,
}

impl Transaction {
    pub fn new(direction: Direction, amount: Decimal, account: Rc<Account>) -> Self {
        Self {
            direction,
            amount: amount.round_dp(account.precision()),
            account,
        }
    }

    pub fn value(&self) -> Decimal {
        match self.direction {
            Direction::Debit => self.amount,
            Direction::Credit => -self.amount,
        }
    }

    pub fn base_amount(&self) -> Decimal {
        match self.account.as_ref() {
            Account::Fiat { .. } => self.amount,
            Account::Crypto(lot) => lot.unit_price_eur * self.amount,
        }
    }
}
