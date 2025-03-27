use super::*;
use rust_decimal_macros::dec;

trait CalculatorTestHelpers {
    fn last_tax_change(&self) -> Decimal;
    fn currency(&self, currency: &str) -> Vec<Amount>;
}

impl CalculatorTestHelpers for TaxCalculator {
    fn last_tax_change(&self) -> Decimal {
        self.tax_rows.iter().last().unwrap().tax_change
    }
    fn currency(&self, currency: &str) -> Vec<Amount> {
        self.state()
            .currencies
            .get(&Currency::from(currency))
            .expect(&format!("Currency {} not found", currency))
            .clone()
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
        calculator.currency("C").get(0).unwrap().purchase_price,
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

#[test]
fn test_example_2_4_4() {
    let mut calculator = TaxCalculator::new();

    calculator.tx(buy!((2022, 1, 1), "BTC", 1, 5000));
    calculator.tx(change2!((2022, 2, 1), ("BTC", 1, 4000), ("B", 10)));
    assert_eq!(calculator.last_tax_change(), dec!(-1000));

    let b = calculator.currency("B");
    assert_eq!(b.len(), 1);
    let b_amount = b.get(0).unwrap();
    assert_eq!(b_amount.amount, dec!(10));
    assert_eq!(b_amount.purchase_price, dec!(400));
    calculator.tx(change_unknown!((2022, 3, 1), ("B", 10), ("C", 4)));
    assert_eq!(calculator.last_tax_change(), dec!(0));

    let c = calculator.currency("C");
    assert_eq!(c.len(), 1);
    let c_amount = c.get(0).unwrap();
    assert_eq!(c_amount.amount, dec!(4));
    assert_eq!(c_amount.purchase_price, dec!(1000));

    calculator.tx(change!((2022, 4, 1), ("C", 4), ("BTC", 1, 7000)));
    assert_eq!(calculator.last_tax_change(), dec!(3000)); // 7 000 € - 4 x 1 000 €
}
