use super::*;
use rust_decimal_macros::dec;

trait LastTaxChange {
    fn last_tax_change(&self) -> Decimal;
}

impl LastTaxChange for TaxCalculator {
    fn last_tax_change(&self) -> Decimal {
        self.tax_rows.iter().last().unwrap().tax_change
    }
}

#[test]
fn test_example_2_2_1() {
    let mut calculator = TaxCalculator::new();

    calculator.tx(buy!((2017, 1, 1), "A", 100, 5));
    calculator.tx(buy!((2017, 2, 1), "A", 100, 10));

    calculator.tx(change!((2017, 3, 1), ("A", 50), ("B", 25, 15)));
    assert_eq!(calculator.tax(2017), dec!(125)); // 25 x 15 € - 50 x 5 €

    calculator.tx(change2!((2017, 4, 1), ("B", 10, 10), ("C", 30)));
    assert_eq!(calculator.last_tax_change(), dec!(-50)); // 10 x 10 € - 10 x 15 €
    assert_eq!(
        calculator
            .state()
            .currencies
            .get(&Currency::from("C"))
            .unwrap()
            .get(0)
            .unwrap()
            .purchase_price,
        dec!(3.33) // 100 € / 30
    );

    calculator.tx(change!((2017, 5, 1), ("B", 15), ("A", 20, 0)));
    assert_eq!(calculator.last_tax_change(), dec!(175)); // 20 x 20 € - 15 x 15 €
    assert_eq!(
        calculator.state().currencies,
        HashMap::from([
            (Currency::from("A"), vec![
                Amount::new(date!(2017, 1, 1), dec!(50), dec!(5)),
                Amount::new(date!(2017, 2, 1), dec!(100), dec!(10)),
                Amount::new(date!(2017, 5, 1), dec!(20), dec!(20)),
            ]),
            (Currency::from("C"), vec![
                Amount::new(date!(2017, 4, 1), dec!(30), dec!(3.33)),
                //
            ])
        ])
    );

    calculator.tx(sell!((2017, 8, 1), "A", 100, 20));
    assert_eq!(
        calculator.tax_rows.iter().last().unwrap().tax_change,
        dec!(1250) // 750 + 500
    );
}
