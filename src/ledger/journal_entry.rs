use chrono::{DateTime, Utc};

use super::transaction::Transaction;

#[derive(Debug)]
pub struct JournalEntry {
    pub timestamp: DateTime<Utc>,
    pub entries: Vec<Transaction>,
}
