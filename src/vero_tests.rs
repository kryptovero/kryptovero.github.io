use super::*;
use rust_decimal_macros::dec;

#[test]
fn test_example_2_2_1() {
    // Sourced from:
    // https://www.vero.fi/en/detailed-guidance/guidance/48411/taxation-of-virtual-currencies3/#:~:text=Example%201
    let eur = Currency::test("EUR");
    let a = Currency::test("A");
    let b = Currency::test("B");
    let c = Currency::test("C");
    let mut ledger = Ledger::new(eur.clone());
    let mut running_tax = dec!(0);

    ledger
        .apply(Event::Acquisition {
            currency: a.clone(),
            amount: dec!(100),
            unit_price_eur: dec!(5),
            timestamp: date!(2017, 1, 1),
            fees_eur: dec!(0),
        })
        .apply(Event::Acquisition {
            currency: a.clone(),
            amount: dec!(100),
            unit_price_eur: dec!(10),
            timestamp: date!(2017, 2, 1),
            fees_eur: dec!(0),
        })
        .apply(Event::TransferKnownTo {
            from: a.clone(),
            to: b.clone(),
            amount_from: dec!(50),
            amount_to: dec!(25),
            unit_price_eur_to: dec!(15),
            timestamp: date!(2017, 3, 1),
            fees_eur: dec!(0),
        });

    running_tax += dec!(125); // 25 x 15 € - 50 x 5 €
    assert_eq!(ledger.tax(2017), running_tax);

    ledger.apply(Event::TransferKnownFrom {
        from: b.clone(),
        to: c.clone(),
        amount_from: dec!(10),
        amount_to: dec!(30),
        unit_price_eur_from: dec!(10),
        timestamp: date!(2017, 4, 1),
        fees_eur: dec!(0),
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
        fees_eur: dec!(0),
    });

    running_tax += dec!(175); // 20 x 20 € - 15 x 15 €
    assert_eq!(ledger.tax(2017), running_tax);

    assert_eq!(
        ledger.all_account_balances(),
        HashMap::from([
            (a.clone(), vec![
                (date!(2017, 1, 1), dec!(50), dec!(5)),
                (date!(2017, 2, 1), dec!(100), dec!(10)),
                (date!(2017, 5, 1), dec!(20), dec!(20)),
            ]),
            (c.clone(), vec![(date!(2017, 4, 1), dec!(30), dec!(3.33)),]),
        ])
    );

    ledger.apply(Event::Disposal {
        currency: a.clone(),
        amount: dec!(100),
        unit_price_eur: dec!(20),
        timestamp: date!(2017, 8, 1),
        fees_eur: dec!(0),
    });

    running_tax += dec!(1250); // 750 + 500
    assert_eq!(ledger.tax(2017), running_tax);
}

#[test]
fn test_example_2_3_2() {
    // Sourced from:
    // https://www.vero.fi/en/detailed-guidance/guidance/48411/taxation-of-virtual-currencies3/#:~:text=Example%202
    let eur = Currency::test("EUR");
    let a = Currency::test("A");
    let mut ledger = Ledger::new(eur.clone());

    ledger
        .apply(Event::Acquisition {
            currency: a.clone(),
            amount: dec!(200),
            unit_price_eur: dec!(5),
            timestamp: date!(2020, 1, 1),
            fees_eur: dec!(0),
        })
        .apply(Event::Disposal {
            currency: a.clone(),
            amount: dec!(100),
            unit_price_eur: dec!(10),
            timestamp: date!(2020, 2, 1),
            fees_eur: dec!(0),
        });

    assert_eq!(ledger.tax(2020), dec!(500));
}

#[test]
fn test_example_2_3_3() {
    // Sourced from:
    // https://www.vero.fi/en/detailed-guidance/guidance/48411/taxation-of-virtual-currencies3/#:~:text=Example%203
    let eur = Currency::test("EUR");
    let b = Currency::test("B");
    let mut ledger = Ledger::new(eur.clone());

    ledger
        .apply(Event::Acquisition {
            currency: b.clone(),
            amount: dec!(10),
            unit_price_eur: dec!(1000),
            timestamp: date!(2020, 1, 1),
            fees_eur: dec!(0),
        })
        .apply(Event::Disposal {
            currency: b.clone(),
            amount: dec!(1),
            unit_price_eur: dec!(500),
            timestamp: date!(2020, 2, 1),
            fees_eur: dec!(0),
        });

    assert_eq!(ledger.tax(2020), dec!(-500));

    assert_eq!(
        ledger.all_account_balances(),
        HashMap::from([(b.clone(), vec![(date!(2020, 1, 1), dec!(9), dec!(1000))])])
    );

    ledger.apply(Event::Disposal {
        currency: b.clone(),
        amount: dec!(9),
        unit_price_eur: dec!(10_000),
        timestamp: date!(2021, 3, 1),
        fees_eur: dec!(1000),
    });

    assert_eq!(ledger.profit(2021), dec!(80_000));
    // TODO: hankintameno-olettamaa / deemed acquisition cost of 20%
    // assert_eq!(ledger.tax(2021), dec!(72_000)); // = 90 000 € - 18 000 €
}

#[test]
fn test_example_2_4_4() {
    let eur = Currency::test("EUR");
    let btc = Currency::test("BTC");
    let b = Currency::test("B");
    let c = Currency::test("C");
    let mut ledger = Ledger::new(eur.clone());
    let mut running_tax = dec!(0);

    ledger
        .apply(Event::Acquisition {
            currency: btc.clone(),
            amount: dec!(1),
            unit_price_eur: dec!(5000),
            timestamp: date!(2022, 1, 1),
            fees_eur: dec!(0),
        })
        .apply(Event::TransferKnownFrom {
            from: btc.clone(),
            to: b.clone(),
            amount_from: dec!(1),
            amount_to: dec!(10),
            unit_price_eur_from: dec!(4000),
            timestamp: date!(2022, 2, 1),
            fees_eur: dec!(0),
        });

    running_tax -= dec!(1000);
    assert_eq!(ledger.tax(2022), running_tax);

    assert_eq!(
        ledger.all_account_balances(),
        HashMap::from([(b.clone(), vec![(date!(2022, 2, 1), dec!(10), dec!(400))])])
    );

    ledger.apply(Event::TransferUnknown {
        from: b.clone(),
        to: c.clone(),
        amount_from: dec!(10),
        amount_to: dec!(4),
        timestamp: date!(2022, 3, 1),
        fees_eur: dec!(0),
    });

    assert_eq!(ledger.tax(2022), running_tax);
    assert_eq!(
        ledger.all_account_balances(),
        HashMap::from([(c.clone(), vec![(date!(2022, 3, 1), dec!(4), dec!(1000))])])
    );

    ledger.apply(Event::TransferKnownTo {
        from: c.clone(),
        to: btc.clone(),
        amount_from: dec!(4),
        amount_to: dec!(1),
        unit_price_eur_to: dec!(7000),
        timestamp: date!(2022, 4, 1),
        fees_eur: dec!(0),
    });
    running_tax += dec!(3000); // 7 000 € - 4 x 1 000 €
    assert_eq!(ledger.tax(2022), running_tax);
}
