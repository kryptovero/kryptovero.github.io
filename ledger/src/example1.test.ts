import test from "ava"
import { Temporal } from "proposal-temporal"
import { calculateGains, Ledger, stateAt } from "."
import { eq } from "./testutils"

// Sourced from:
// https://www.vero.fi/en/detailed-guidance/guidance/48411/taxation-of-virtual-currencies3/#:~:text=Example%201

const initialLedger: Ledger = [
  {
    id: "1",
    date: Temporal.PlainDate.from("2017-01-01"),
    from: { symbol: "EUR", amount: 500, unitPriceEur: 1 },
    to: { symbol: "A", unitPriceEur: 5, amount: 100 },
  },
  {
    id: "2",
    date: Temporal.PlainDate.from("2017-02-01"),
    from: { symbol: "EUR", amount: 1000, unitPriceEur: 1 },
    to: { symbol: "A", unitPriceEur: 10, amount: 100 },
  },
  {
    id: "3",
    date: Temporal.PlainDate.from("2017-03-01"),
    from: { symbol: "A", amount: 50 },
    to: { symbol: "B", amount: 25, unitPriceEur: 15 },
  },
]

test("Example 1.1", (t) => {
  t.is(
    calculateGains(
      Temporal.PlainDate.from("2016-12-31"),
      Temporal.PlainDate.from("2017-03-01"),
      initialLedger
    ),
    125
  )
})

const ledger2: Ledger = [
  ...initialLedger,
  {
    id: "4",
    date: Temporal.PlainDate.from("2017-04-01"),
    from: { symbol: "B", unitPriceEur: 10, amount: 10 },
    to: { symbol: "C", amount: 30 },
  },
]
test("Example 1.2", (t) => {
  t.is(
    calculateGains(
      Temporal.PlainDate.from("2017-03-01"),
      Temporal.PlainDate.from("2017-04-01"),
      ledger2
    ),
    -50
  )
})

const ledger3: Ledger = [
  ...ledger2,
  {
    id: "5",
    date: Temporal.PlainDate.from("2017-05-01"),
    from: { symbol: "B", amount: 15 },
    to: { symbol: "A", amount: 20, unitPriceEur: 20 },
  },
]

test("Example 1.3", (t) => {
  t.is(
    calculateGains(
      Temporal.PlainDate.from("2017-04-01"),
      Temporal.PlainDate.from("2017-05-01"),
      ledger3
    ),
    175
  )
  const result = stateAt(Temporal.PlainDate.from("2017-05-01"), ledger3)
  const expected = {
    A: [
      {
        amount: 50,
        purchaseDate: Temporal.PlainDate.from("2017-01-01"),
        unitPriceEur: 5,
      },
      {
        amount: 100,
        purchaseDate: Temporal.PlainDate.from("2017-02-01"),
        unitPriceEur: 10,
      },
      {
        amount: 20,
        purchaseDate: Temporal.PlainDate.from("2017-05-01"),
        unitPriceEur: 20,
      },
    ],
    B: [],
    C: [
      {
        amount: 30,
        purchaseDate: Temporal.PlainDate.from("2017-04-01"),
        unitPriceEur: 100 / 30,
      },
    ],
    EUR: [
      {
        amount: -1500,
        purchaseDate: Temporal.PlainDate.from("2017-02-01"),
        unitPriceEur: 1,
      },
    ],
  }
  eq(t, result, expected)
})

const ledger4: Ledger = [
  ...ledger3,
  {
    id: "6",
    date: Temporal.PlainDate.from("2017-08-01"),
    from: { symbol: "A", amount: 100, unitPriceEur: 20 },
    to: { symbol: "EUR", amount: 2_000, unitPriceEur: 1 },
  },
]
test("Example 1.4", (t) => {
  t.is(
    calculateGains(
      Temporal.PlainDate.from("2017-05-01"),
      Temporal.PlainDate.from("2017-08-01"),
      ledger4
    ),
    750 + 500
  )
})
