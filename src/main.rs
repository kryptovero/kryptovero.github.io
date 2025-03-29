use std::{
    cell::RefCell,
    cmp::Ordering,
    collections::{BTreeMap, HashMap},
    rc::Rc,
    result,
};

use chrono::{DateTime, Datelike, Utc};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
mod date_macros;

#[cfg(test)]
mod vero_tests;

fn main() {
    println!("Hello, world!");
}

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Currency {
    code: String,
    precision: u32,
}

impl Currency {
    pub fn new(code: String, precision: u32) -> Self {
        Self { code, precision }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
struct Lot {
    currency: Currency,
    unit_price_eur: Decimal,
    timestamp: DateTime<Utc>,
}

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
enum Account {
    Fiat { currency: Currency, id: String },
    Crypto(Lot),
}

impl Account {
    fn crypto_timestamp<'a>(&'a self) -> &'a DateTime<Utc> {
        let Account::Crypto(Lot { timestamp, .. }) = self else {
            panic!("Expected crypto account");
        };
        timestamp
    }

    fn crypto_unit_price_eur(&self) -> &Decimal {
        let Account::Crypto(Lot { unit_price_eur, .. }) = self else {
            panic!("Expected crypto account");
        };
        unit_price_eur
    }

    fn code(&self) -> &str {
        self.currency().code.as_str()
    }

    fn currency(&self) -> &Currency {
        match self {
            Account::Fiat { currency, .. } => currency,
            Account::Crypto(lot) => &lot.currency,
        }
    }

    fn precision(&self) -> u32 {
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

enum Event {
    Acquisition {
        currency: Currency,
        amount: Decimal,
        unit_price_eur: Decimal,
        timestamp: DateTime<Utc>,
    },
    Disposal {
        currency: Currency,
        amount: Decimal,
        unit_price_eur: Decimal,
        timestamp: DateTime<Utc>,
    },
    TransferKnownFrom {
        from: Currency,
        to: Currency,
        amount_from: Decimal,
        amount_to: Decimal,
        unit_price_eur_from: Decimal,
        timestamp: DateTime<Utc>,
    },
    TransferKnownTo {
        from: Currency,
        to: Currency,
        amount_from: Decimal,
        amount_to: Decimal,
        unit_price_eur_to: Decimal,
        timestamp: DateTime<Utc>,
    },
    TransferUnknown {
        from: Currency,
        to: Currency,
        amount_from: Decimal,
        amount_to: Decimal,
        timestamp: DateTime<Utc>,
    },
}

#[derive(Debug)]
struct Ledger {
    base_currency_account: Rc<Account>,
    net_profit: Rc<Account>,
    accounts: Vec<Rc<Account>>,
    journal: Vec<JournalEntry>,
}

impl Ledger {
    fn new(base_currency: Currency) -> Self {
        Ledger {
            base_currency_account: Rc::new(Account::Fiat {
                currency: base_currency.clone(),
                id: "cash".to_string(),
            }),
            net_profit: Rc::new(Account::Fiat {
                currency: base_currency,
                id: "earnings".to_string(),
            }),
            accounts: vec![],
            journal: vec![],
        }
    }

    fn cash_account(&self) -> Rc<Account> {
        self.base_currency_account.clone()
    }

    fn net_profit_account(&self) -> Rc<Account> {
        self.net_profit.clone()
    }

    fn tax(&self, year: i32) -> Decimal {
        let value = self
            .journal
            .iter()
            .filter(|j| j.timestamp.year() == year)
            .flat_map(|j| {
                j.entries
                    .iter()
                    .filter(|t| t.account == self.net_profit_account())
                    .map(|t| t.value())
            })
            .sum::<Decimal>();

        -value
    }

    fn add_crypto_account(
        &mut self,
        currency: Currency,
        unit_price_eur: Decimal,
        timestamp: DateTime<Utc>,
    ) -> Rc<Account> {
        let account = Rc::new(Account::Crypto(Lot {
            currency,
            unit_price_eur: unit_price_eur.round_dp(self.base_currency_account.precision()),
            timestamp,
        }));
        self.accounts.push(account.clone());
        account
    }

    fn accounts_with_balance_for(&self, currency: &Currency) -> Vec<(Rc<Account>, Decimal)> {
        // Accounts are sorted by timestamp
        let mut account_sums: BTreeMap<Rc<Account>, Decimal> = BTreeMap::new();

        let transcations = self
            .journal
            .iter()
            .flat_map(|j| j.entries.iter())
            .filter(|tx| match tx.account.as_ref() {
                Account::Crypto(lot) => lot.currency == *currency,
                Account::Fiat { .. } => false,
            });

        for transaction in transcations {
            let amount = transaction.value();

            account_sums
                .entry(transaction.account.clone())
                .and_modify(|sum| *sum += amount)
                .or_insert(amount);
        }

        account_sums
            .into_iter()
            .filter(|(_, sum)| !sum.is_zero())
            .collect()
    }

    fn all_account_balances(&self) -> HashMap<Currency, Vec<(DateTime<Utc>, Decimal, Decimal)>> {
        self.accounts
            .iter()
            .map(|account| {
                (
                    account.currency().clone(),
                    self.accounts_with_balance_for(account.currency())
                        .into_iter()
                        .map(|(account, sum)| {
                            (
                                *account.crypto_timestamp(),
                                sum,
                                *account.crypto_unit_price_eur(),
                            )
                        })
                        .collect::<Vec<_>>(),
                )
            })
            .filter(|(_, balances)| !balances.is_empty())
            .collect()
    }

    fn produce_journal_entries(
        &mut self,
        amount: Decimal,
        currency: &Currency,
        callback: impl Fn(Decimal, Rc<Account>, &Lot, &mut Self) -> JournalEntry,
    ) {
        let mut amount_left = amount;
        let mut journal_entries = vec![];

        for (account, sum) in self.accounts_with_balance_for(&currency) {
            let Account::Crypto(lot) = account.as_ref() else {
                panic!("Expected crypto account");
            };

            let amount_to_use = amount_left.min(sum);
            amount_left -= amount_to_use;

            journal_entries.push(callback(amount_to_use, account.clone(), lot, self));

            if amount_left.is_zero() {
                break;
            }
        }

        self.journal.extend(journal_entries);
    }

    fn apply(&mut self, event: Event) -> &mut Self {
        match event {
            Event::Acquisition {
                currency,
                unit_price_eur,
                amount,
                timestamp,
            } => {
                let currency_account = self.add_crypto_account(currency, unit_price_eur, timestamp);

                self.journal.push(JournalEntry {
                    timestamp,
                    entries: vec![
                        Transaction::new(
                            Direction::Credit,
                            unit_price_eur * amount,
                            self.cash_account(),
                        ),
                        Transaction::new(Direction::Debit, amount, currency_account),
                    ],
                });
            }
            Event::Disposal {
                currency,
                amount,
                unit_price_eur,
                timestamp,
            } => {
                let cash_account = self.cash_account();
                let net_profit_account = self.net_profit_account();

                self.produce_journal_entries(
                    amount,
                    &currency,
                    |amount_to_use, account, lot, _| {
                        let cash_amount = amount_to_use * unit_price_eur;
                        let earnings_amount = cash_amount - lot.unit_price_eur * amount_to_use;

                        JournalEntry {
                            timestamp,
                            entries: vec![
                                Transaction::new(Direction::Credit, amount_to_use, account),
                                Transaction::new(
                                    Direction::Debit,
                                    cash_amount,
                                    cash_account.clone(),
                                ),
                                Transaction::new(
                                    Direction::Credit,
                                    earnings_amount,
                                    net_profit_account.clone(),
                                ),
                            ],
                        }
                    },
                );
            }
            Event::TransferKnownFrom {
                from,
                to,
                amount_from,
                amount_to,
                unit_price_eur_from,
                timestamp,
            } => {
                let unit_price_eur_to = unit_price_eur_from * amount_from / amount_to;
                let to_account = self.add_crypto_account(to, unit_price_eur_to, timestamp);
                let net_profit_account = self.net_profit_account();

                self.produce_journal_entries(
                    amount_from,
                    &from,
                    |amount_to_use, account, lot, _| {
                        let percentage = amount_to_use / amount_from;

                        let to_amount = amount_to * percentage;
                        let cash_amount = to_amount * unit_price_eur_to;
                        let earnings_amount = cash_amount - lot.unit_price_eur * amount_to_use;

                        JournalEntry {
                            timestamp,
                            entries: vec![
                                Transaction::new(Direction::Credit, amount_to_use, account),
                                Transaction::new(Direction::Debit, to_amount, to_account.clone()),
                                Transaction::new(
                                    Direction::Credit,
                                    earnings_amount,
                                    net_profit_account.clone(),
                                ),
                            ],
                        }
                    },
                );
            }

            Event::TransferKnownTo {
                from,
                to,
                amount_from,
                amount_to,
                unit_price_eur_to,
                timestamp,
            } => {
                let to_account = self.add_crypto_account(to, unit_price_eur_to, timestamp);
                let net_profit_account = self.net_profit_account();
                self.produce_journal_entries(
                    amount_from,
                    &from,
                    |amount_to_use, account, lot, _| {
                        let percentage = amount_to_use / amount_from;

                        let to_amount = (amount_to * percentage);
                        let cash_amount = to_amount * unit_price_eur_to;
                        let earnings_amount = cash_amount - lot.unit_price_eur * amount_to_use;

                        JournalEntry {
                            timestamp,
                            entries: vec![
                                Transaction::new(Direction::Credit, amount_to_use, account),
                                Transaction::new(Direction::Debit, to_amount, to_account.clone()),
                                Transaction::new(
                                    Direction::Credit,
                                    earnings_amount,
                                    net_profit_account.clone(),
                                ),
                            ],
                        }
                    },
                );
            }

            Event::TransferUnknown {
                from,
                to,
                amount_from,
                amount_to,
                timestamp,
            } => {
                self.produce_journal_entries(
                    amount_from,
                    &from,
                    |amount_to_use, account, lot, ledger| {
                        let percentage = amount_to_use / amount_from;

                        let unit_price_eur_from = lot.unit_price_eur;
                        let unit_price_eur_to = unit_price_eur_from * amount_from / amount_to;

                        let to_account =
                            ledger.add_crypto_account(to.clone(), unit_price_eur_to, timestamp);
                        let to_amount = amount_to * percentage;

                        JournalEntry {
                            timestamp,
                            entries: vec![
                                Transaction::new(Direction::Credit, amount_to_use, account),
                                Transaction::new(Direction::Debit, to_amount, to_account.clone()),
                            ],
                        }
                    },
                );
            }
        };
        self
    }

    fn accounts_of_type(&self, currency: &Currency) -> Vec<Rc<Account>> {
        self.accounts
            .iter()
            .filter(|account| match account.as_ref() {
                Account::Fiat { .. } => false,
                Account::Crypto(lot) => lot.currency == *currency,
            })
            .cloned()
            .collect()
    }
}

#[derive(Debug)]
struct JournalEntry {
    timestamp: DateTime<Utc>,
    entries: Vec<Transaction>,
}

#[derive(Debug)]
enum Direction {
    Debit,
    Credit,
}

#[derive(Debug)]
struct Transaction {
    direction: Direction,
    amount: Decimal,
    account: Rc<Account>,
}

impl Transaction {
    fn new(direction: Direction, amount: Decimal, account: Rc<Account>) -> Self {
        Self {
            direction,
            amount: amount.round_dp(account.precision()),
            account,
        }
    }

    fn value(&self) -> Decimal {
        match self.direction {
            Direction::Debit => self.amount,
            Direction::Credit => -self.amount,
        }
    }

    fn base_amount(&self) -> Decimal {
        match self.account.as_ref() {
            Account::Fiat { .. } => self.amount,
            Account::Crypto(lot) => lot.unit_price_eur * self.amount,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;
    use std::collections::HashMap;

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
        pub fn test(code: String) -> Self {
            Self { code, precision: 2 }
        }
    }

    #[test]
    fn test_acquisition_produces_correct_balance() {
        let eur = Currency::test("EUR".to_string());
        let btc = Currency::test("BTC".to_string());
        let mut ledger = Ledger::new(eur.clone());

        let ledger = ledger.apply(Event::Acquisition {
            currency: btc,
            unit_price_eur: dec!(100),
            amount: dec!(2),
            timestamp: DateTime::from_timestamp(1716873600, 0).unwrap(),
        });
        ledger.assert_balance_is_consistent();
        ledger.assert_base_currency_balance(dec!(-200));
        ledger.assert_balance("BTC", dec!(2));
        ledger.assert_net_profit(dec!(0));
    }

    #[test]
    fn test_buy_and_sell_produces_correct_balance() {
        let eur = Currency::test("EUR".to_string());
        let btc = Currency::test("BTC".to_string());
        let mut ledger = Ledger::new(eur.clone());

        let ledger = ledger
            .apply(Event::Acquisition {
                currency: btc.clone(),
                unit_price_eur: dec!(100),
                amount: dec!(2),
                timestamp: DateTime::from_timestamp(1716873600, 0).unwrap(),
            })
            .apply(Event::Disposal {
                currency: btc,
                amount: dec!(1),
                unit_price_eur: dec!(150),
                timestamp: DateTime::from_timestamp(1716883600, 0).unwrap(),
            });

        ledger.assert_balance_is_consistent();
        ledger.assert_base_currency_balance(dec!(-50));
        ledger.assert_balance("BTC", dec!(1));
        ledger.assert_net_profit(dec!(50));
    }

    fn test_simple_transfer_produces_correct_balance() {
        let eur = Currency::test("EUR".to_string());
        let btc = Currency::test("BTC".to_string());
        let eth = Currency::test("ETH".to_string());
        let mut ledger = Ledger::new(eur.clone());

        let ledger = ledger
            .apply(Event::Acquisition {
                currency: btc.clone(),
                unit_price_eur: dec!(100),
                amount: dec!(2),
                timestamp: DateTime::from_timestamp(1716873600, 0).unwrap(),
            })
            .apply(Event::TransferKnownFrom {
                from: btc,
                to: eth,
                amount_from: dec!(1),
                amount_to: dec!(10),
                unit_price_eur_from: dec!(75),
                timestamp: DateTime::from_timestamp(1716883600, 0).unwrap(),
            });

        ledger.assert_balance_is_consistent();
        ledger.assert_base_currency_balance(dec!(-200));
        ledger.assert_balance("BTC", dec!(1));
        ledger.assert_balance("ETH", dec!(10));
        ledger.assert_net_profit(dec!(-25));
    }
}
