import test from "ava"
import { Temporal } from "proposal-temporal"
import { calculateGains, Ledger, stateAt } from "."
import { eq } from "./testutils"

// Sourced from:
// https://www.vero.fi/en/detailed-guidance/guidance/48411/taxation-of-virtual-currencies3/#:~:text=Example%203

const initialLedger: Ledger = [
  {
    date: Temporal.PlainDate.from("2020-01-01"),
    from: { amount: 10_000, symbol: "EUR", unitPriceEur: 1 },
    to: { amount: 10, symbol: "B", unitPriceEur: 1_000 },
  },
  {
    date: Temporal.PlainDate.from("2020-02-01"),
    from: { amount: 1, symbol: "B", unitPriceEur: 500 },
    to: { amount: 500, symbol: "EUR", unitPriceEur: 1 },
  },
]

test("Example 3.1", (t) => {
  t.is(
    calculateGains(
      Temporal.PlainDate.from("2019-12-31"),
      Temporal.PlainDate.from("2020-02-01"),
      initialLedger
    ),
    -500
  )

  eq(t, stateAt(Temporal.PlainDate.from("2020-02-01"), initialLedger).B, [
    {
      amount: 9,
      purchaseDate: Temporal.PlainDate.from("2020-01-01"),
      unitPriceEur: 1000,
    },
  ])
})

const ledger2: Ledger = [
  ...initialLedger,
  {
    date: Temporal.PlainDate.from("2020-03-01"),
    from: { symbol: "B", amount: 9, unitPriceEur: 10_000 },
    to: { symbol: "EUR", amount: 90_000, unitPriceEur: 1 },
    fee: { symbol: "EUR", amount: 1_000, unitPriceEur: 1 },
  },
]

test("Example 3.2", (t) => {
  t.is(
    calculateGains(
      Temporal.PlainDate.from("2020-02-01"),
      Temporal.PlainDate.from("2020-03-01"),
      ledger2
    ),
    72_000
  )
})

const ledger2_10YearVersion: Ledger = [
  ...initialLedger,
  {
    date: Temporal.PlainDate.from("2030-03-01"),
    from: { symbol: "B", amount: 9, unitPriceEur: 10_000 },
    to: { symbol: "EUR", amount: 90_000, unitPriceEur: 1 },
    fee: { symbol: "EUR", amount: 1_000, unitPriceEur: 1 },
  },
]

test("Example 3.2, but hold for over 10 years", (t) => {
  t.is(
    calculateGains(
      Temporal.PlainDate.from("2020-02-01"),
      Temporal.PlainDate.from("2030-03-01"),
      ledger2_10YearVersion
    ),
    54_000
  )
})
