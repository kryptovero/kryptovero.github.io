use std::{collections::HashMap, rc::Rc};

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

fn main() {
    println!("Hello, world!");
}

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Currency(String);

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
    fn currency(&self) -> &str {
        match self {
            Account::Fiat {
                currency: Currency(currency),
                ..
            } => currency,
            Account::Crypto(Lot {
                currency: Currency(currency),
                ..
            }) => currency,
        }
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
    Transfer,
}

struct Ledger {
    base_currency_account: Rc<Account>,
    earnings_account: Rc<Account>,
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
            earnings_account: Rc::new(Account::Fiat {
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

    fn earnings_account(&self) -> Rc<Account> {
        self.earnings_account.clone()
    }

    fn apply(&mut self, event: Event) -> &mut Self {
        match event {
            Event::Acquisition {
                currency,
                unit_price_eur,
                amount,
                timestamp,
            } => {
                self.accounts.push(Rc::new(Account::Crypto(Lot {
                    currency,
                    unit_price_eur,
                    timestamp,
                })));
                let currency_account = self.accounts.last().unwrap().clone();

                self.journal.push(JournalEntry {
                    timestamp,
                    entries: vec![
                        Transaction {
                            direction: Direction::Credit,
                            amount: unit_price_eur * amount,
                            account: self.cash_account(),
                        },
                        Transaction {
                            direction: Direction::Debit,
                            amount,
                            account: currency_account,
                        },
                    ],
                });
            }
            Event::Disposal {
                currency,
                amount,
                unit_price_eur,
                timestamp,
            } => {
                let mut account_sums: HashMap<Rc<Account>, Decimal> = HashMap::new();

                for transaction in self.journal.iter().flat_map(|j| j.entries.iter()) {
                    let Account::Crypto(Lot {
                        currency: lot_currency,
                        ..
                    }) = transaction.account.as_ref()
                    else {
                        continue;
                    };

                    if lot_currency != &currency {
                        continue;
                    }

                    let amount = transaction.value();

                    account_sums
                        .entry(transaction.account.clone())
                        .and_modify(|sum| *sum += amount)
                        .or_insert(amount);
                }

                let mut amount_left = amount;
                let mut journal_entries = vec![];

                for (account, sum) in account_sums {
                    if sum.is_zero() {
                        continue;
                    }

                    let Account::Crypto(lot) = account.as_ref() else {
                        panic!("Expected crypto account");
                    };

                    let amount_to_use = amount_left.min(sum);
                    amount_left -= amount_to_use;

                    let cash_amount = amount_to_use * unit_price_eur;
                    let earnings_amount = cash_amount - lot.unit_price_eur * amount_to_use;

                    journal_entries.push(JournalEntry {
                        timestamp,
                        entries: vec![
                            Transaction {
                                direction: Direction::Credit,
                                amount: amount_to_use,
                                account,
                            },
                            Transaction {
                                direction: Direction::Debit,
                                amount: cash_amount,
                                account: self.cash_account(),
                            },
                            Transaction {
                                direction: Direction::Credit,
                                amount: earnings_amount,
                                account: self.earnings_account(),
                            },
                        ],
                    });

                    if amount_left.is_zero() {
                        break;
                    }
                }

                self.journal.extend(journal_entries);
            }
            _ => unimplemented!(),
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

struct JournalEntry {
    timestamp: DateTime<Utc>,
    entries: Vec<Transaction>,
}

enum Direction {
    Debit,
    Credit,
}

struct Transaction {
    direction: Direction,
    amount: Decimal,
    account: Rc<Account>,
}

impl Transaction {
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
            let sum = self.calculate_balance(|t| t.account.currency() == currency);
            assert_eq!(amount, sum);
        }

        fn assert_base_currency_balance(&self, amount: Decimal) {
            let sum = self.calculate_balance(|t| t.account == self.base_currency_account);
            assert_eq!(amount, sum);
        }
    }

    #[test]
    fn test_acquisition_produces_correct_balance() {
        let eur = Currency("EUR".to_string());
        let btc = Currency("BTC".to_string());
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
    }

    #[test]
    fn test_buy_and_sell_produces_correct_balance() {
        let eur = Currency("EUR".to_string());
        let btc = Currency("BTC".to_string());
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
    }
}
