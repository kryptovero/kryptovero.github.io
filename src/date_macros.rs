#[macro_export]
macro_rules! date {
    ($year:expr, $month:expr, $day:expr) => {
        chrono::NaiveDate::from_ymd_opt($year, $month, $day)
            .expect("Invalid date")
            .and_hms_opt(0, 0, 0)
            .expect("Invalid time")
            .and_utc()
    };
}
