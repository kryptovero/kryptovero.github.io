use std::{
    collections::{BTreeMap, HashMap},
    rc::Rc,
};

use chrono::{DateTime, Datelike, Utc};
use rust_decimal::Decimal;

use super::{
    Direction, JournalEntry, Transaction, account::Account, currency::Currency, event::Event,
    lot::Lot,
};

#[derive(Debug)]
pub struct Ledger {
    pub(crate) base_currency_account: Rc<Account>,
    pub(crate) net_profit: Rc<Account>,
    pub(crate) accounts: Vec<Rc<Account>>,
    pub(crate) journal: Vec<JournalEntry>,
}

impl Ledger {
    pub fn new(base_currency: Currency) -> Self {
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

    pub fn tax(&self, year: i32) -> Decimal {
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

    pub fn profit(&self, year: i32) -> Decimal {
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

    pub fn all_account_balances(
        &self,
    ) -> HashMap<Currency, Vec<(DateTime<Utc>, Decimal, Decimal)>> {
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

    pub fn apply(&mut self, event: Event) -> &mut Self {
        match event {
            Event::Acquisition {
                currency,
                unit_price_eur,
                amount,
                timestamp,
                fees_eur,
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
                self.handle_fees(fees_eur, timestamp);
            }
            Event::Disposal {
                currency,
                amount,
                unit_price_eur,
                timestamp,
                fees_eur,
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
                self.handle_fees(fees_eur, timestamp);
            }
            Event::TransferKnownFrom {
                from,
                to,
                amount_from,
                amount_to,
                unit_price_eur_from,
                timestamp,
                fees_eur,
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
                self.handle_fees(fees_eur, timestamp);
            }

            Event::TransferKnownTo {
                from,
                to,
                amount_from,
                amount_to,
                unit_price_eur_to,
                timestamp,
                fees_eur,
            } => {
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
                self.handle_fees(fees_eur, timestamp);
            }

            Event::TransferUnknown {
                from,
                to,
                amount_from,
                amount_to,
                timestamp,
                fees_eur,
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
                self.handle_fees(fees_eur, timestamp);
            }
        };
        self
    }

    fn handle_fees(&mut self, fees_eur: Decimal, timestamp: DateTime<Utc>) {
        if fees_eur.is_zero() {
            return;
        }

        self.journal.push(JournalEntry {
            timestamp,
            entries: vec![
                Transaction::new(Direction::Debit, fees_eur, self.net_profit_account()),
                Transaction::new(Direction::Credit, fees_eur, self.cash_account()),
            ],
        });
    }

    pub fn accounts_of_type(&self, currency: &Currency) -> Vec<Rc<Account>> {
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
