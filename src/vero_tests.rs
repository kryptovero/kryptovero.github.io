use super::*;
use rust_decimal_macros::dec;

#[test]
fn test_example_2_2_1() {
    let eur = Currency::test("EUR".to_string());
    let a = Currency::test("A".to_string());
    let b = Currency::test("B".to_string());
    let c = Currency::test("C".to_string());
    let mut ledger = Ledger::new(eur.clone());
    let mut running_tax = dec!(0);

    ledger
        .apply(Event::Acquisition {
            currency: a.clone(),
            amount: dec!(100),
            unit_price_eur: dec!(5),
            timestamp: date!(2017, 1, 1),
        })
        .apply(Event::Acquisition {
            currency: a.clone(),
            amount: dec!(100),
            unit_price_eur: dec!(10),
            timestamp: date!(2017, 2, 1),
        })
        .apply(Event::TransferKnownTo {
            from: a.clone(),
            to: b.clone(),
            amount_from: dec!(50),
            amount_to: dec!(25),
            unit_price_eur_to: dec!(15),
            timestamp: date!(2017, 3, 1),
        });

    running_tax += dec!(125);  // 25 x 15 € - 50 x 5 €
    assert_eq!(ledger.tax(2017), running_tax);

    ledger.apply(Event::TransferKnownFrom {
        from: b.clone(),
        to: c.clone(),
        amount_from: dec!(10),
        amount_to: dec!(30),
        unit_price_eur_from: dec!(10),
        timestamp: date!(2017, 4, 1),
    });
    running_tax -= dec!(50); // 10 x 10 € - 10 x 15 €
    assert_eq!(ledger.tax(2017), running_tax);
    assert_eq!(
        ledger.accounts_of_type(&c).first().unwrap().as_ref(),
        &Account::Crypto(Lot {
            currency: c.clone(),
            unit_price_eur: dec!(3.33), // 100 € / 30
            timestamp: date!(2017, 4, 1),
        })
    );

    ledger.apply(Event::TransferKnownTo {
        from: b.clone(),
        to: a.clone(),
        amount_from: dec!(15),
        amount_to: dec!(20),
        unit_price_eur_to: dec!(20),
        timestamp: date!(2017, 5, 1),
    });

    assert_eq!(ledger.tax(2017), dec!(250)); // last sum + 20 x 20 € - 15 x 15 € = last sum + 175
    /*

    assert_eq!(ledger.last_tax_change(), dec!(175)); // 20 x 20 € - 15 x 15 €
    assert_eq!(
        ledger.state().currencies,
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

    ledger.apply(sell!((2017, 8, 1), "A", 100, 20));
    assert_eq!(
        ledger.tax_rows.iter().last().unwrap().tax_change,
        dec!(1250) // 750 + 500
    );*/
}
/*
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
*/
