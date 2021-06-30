import test from "ava"
import { Temporal } from "proposal-temporal"
import { calculateGains, Ledger } from "."
import { toComputedLedger } from "./to-computed-ledger"

// Sourced from:
// https://www.vero.fi/en/detailed-guidance/guidance/48411/taxation-of-virtual-currencies3/#:~:text=Example%204

const initialLedger: Ledger = [
  {
    id: "1",
    date: Temporal.PlainDate.from("2020-01-01"),
    from: { amount: 5_000, symbol: "EUR", unitPriceEur: 1 },
    to: { amount: 1, symbol: "BTC", unitPriceEur: 5_000 },
  },
  {
    id: "2",
    date: Temporal.PlainDate.from("2020-02-01"),
    from: { amount: 1, symbol: "BTC", unitPriceEur: 4_000 },
    to: { amount: 10, symbol: "B" },
  },
]

test("Example 4.1", (t) => {
  t.is(
    calculateGains(
      Temporal.PlainDate.from("2019-12-31"),
      Temporal.PlainDate.from("2020-02-01"),
      initialLedger
    ),
    -1_000
  )
})

const ledger2: Ledger = [
  ...initialLedger,
  {
    id: "3",
    date: Temporal.PlainDate.from("2020-03-01"),
    from: { amount: 10, symbol: "B" },
    to: { amount: 4, symbol: "C" },
  },
]

test("Example 4.2", (t) => {
  t.is(
    calculateGains(
      Temporal.PlainDate.from("2020-02-01"),
      Temporal.PlainDate.from("2020-03-01"),
      ledger2
    ),
    0
  )
})

const ledger3: Ledger = [
  ...ledger2,
  {
    id: "4",
    date: Temporal.PlainDate.from("2020-04-01"),
    from: { amount: 4, symbol: "C" },
    to: { amount: 1, symbol: "BTC", unitPriceEur: 7_000 },
  },
]

test("Example 4.3", (t) => {
  t.is(
    calculateGains(
      Temporal.PlainDate.from("2020-03-01"),
      Temporal.PlainDate.from("2020-04-01"),
      ledger3
    ),
    3_000
  )
})
