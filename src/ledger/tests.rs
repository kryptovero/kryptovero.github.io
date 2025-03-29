use super::*;
use rust_decimal_macros::dec;

trait LedgerTest {
    fn assert_balance_is_consistent(self: &Self);
    fn assert_balance(self: &Self, currency: &str, amount: Decimal);
    fn assert_base_currency_balance(self: &Self, amount: Decimal);
    fn assert_net_profit(self: &Self, amount: Decimal);
}

impl Ledger {
    fn calculate_balance<F>(self: &Self, filter: F) -> Decimal
    where
        F: Fn(&Transaction) -> bool,
    {
        self.journal
            .iter()
            .flat_map(|entry| entry.entries.iter().filter(|f| filter(f)))
            .fold(Decimal::from(0), |sum, transaction| {
                sum + transaction.value()
            })
    }
}

impl LedgerTest for Ledger {
    fn assert_balance_is_consistent(&self) {
        let mut balance = Decimal::from(0);

        for transaction in self.journal.iter().flat_map(|j| j.entries.iter()) {
            match transaction.direction {
                Direction::Debit => balance += transaction.base_amount(),
                Direction::Credit => balance -= transaction.base_amount(),
            }
        }

        assert!(balance.is_zero(), "Balance is not zero: {}", balance);
    }

    fn assert_balance(&self, currency: &str, amount: Decimal) {
        let sum = self.calculate_balance(|t| t.account.code() == currency);
        assert_eq!(amount, sum);
    }

    fn assert_base_currency_balance(&self, amount: Decimal) {
        let sum = self.calculate_balance(|t| t.account == self.base_currency_account);
        assert_eq!(amount, sum);
    }

    fn assert_net_profit(&self, amount: Decimal) {
        let sum = self.calculate_balance(|t| t.account == self.net_profit);
        assert_eq!(-amount, sum);
    }
}

impl Currency {
    pub fn test(code: &str) -> Self {
        Self {
            code: code.to_string(),
            precision: 2,
        }
    }
}

#[test]
fn test_acquisition_produces_correct_balance() {
    let eur = Currency::test("EUR");
    let btc = Currency::test("BTC");
    let mut ledger = Ledger::new(eur.clone());

    let ledger = ledger.apply(Event::Acquisition {
        currency: btc,
        unit_price_eur: dec!(100),
        amount: dec!(2),
        timestamp: date!(2020, 1, 1),
        fees_eur: dec!(0),
    });
    ledger.assert_balance_is_consistent();
    ledger.assert_base_currency_balance(dec!(-200));
    ledger.assert_balance("BTC", dec!(2));
    ledger.assert_net_profit(dec!(0));
}

#[test]
fn test_buy_and_sell_produces_correct_balance() {
    let eur = Currency::test("EUR");
    let btc = Currency::test("BTC");
    let mut ledger = Ledger::new(eur.clone());

    let ledger = ledger
        .apply(Event::Acquisition {
            currency: btc.clone(),
            unit_price_eur: dec!(100),
            amount: dec!(2),
            timestamp: date!(2020, 1, 1),
            fees_eur: dec!(0),
        })
        .apply(Event::Disposal {
            currency: btc,
            amount: dec!(1),
            unit_price_eur: dec!(150),
            timestamp: date!(2020, 2, 1),
            fees_eur: dec!(0),
        });

    ledger.assert_balance_is_consistent();
    ledger.assert_base_currency_balance(dec!(-50));
    ledger.assert_balance("BTC", dec!(1));
    ledger.assert_net_profit(dec!(50));
}

#[test]
fn test_buy_and_sell_produces_correct_balance_with_fees() {
    let eur = Currency::test("EUR");
    let btc = Currency::test("BTC");
    let mut ledger = Ledger::new(eur.clone());

    let ledger = ledger
        .apply(Event::Acquisition {
            currency: btc.clone(),
            unit_price_eur: dec!(100),
            amount: dec!(2),
            timestamp: date!(2020, 1, 1),
            fees_eur: dec!(10),
        })
        .apply(Event::Disposal {
            currency: btc,
            amount: dec!(1),
            unit_price_eur: dec!(150),
            timestamp: date!(2020, 2, 1),
            fees_eur: dec!(10),
        });

    ledger.assert_balance_is_consistent();
    ledger.assert_base_currency_balance(dec!(-70));
    ledger.assert_balance("BTC", dec!(1));
    ledger.assert_net_profit(dec!(30));
}

#[test]
fn test_simple_transfer_produces_correct_balance() {
    let eur = Currency::test("EUR");
    let btc = Currency::test("BTC");
    let eth = Currency::test("ETH");
    let mut ledger = Ledger::new(eur.clone());

    let ledger = ledger
        .apply(Event::Acquisition {
            currency: btc.clone(),
            unit_price_eur: dec!(100),
            amount: dec!(2),
            timestamp: date!(2020, 1, 1),
            fees_eur: dec!(0),
        })
        .apply(Event::TransferKnownFrom {
            from: btc,
            to: eth,
            amount_from: dec!(1),
            amount_to: dec!(10),
            unit_price_eur_from: dec!(75),
            timestamp: date!(2020, 2, 1),
            fees_eur: dec!(0),
        });

    ledger.assert_balance_is_consistent();
    ledger.assert_base_currency_balance(dec!(-200));
    ledger.assert_balance("BTC", dec!(1));
    ledger.assert_balance("ETH", dec!(10));
    ledger.assert_net_profit(dec!(-25));
}
