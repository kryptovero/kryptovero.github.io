import test from "ava"
import { Temporal } from "proposal-temporal"
import { LedgerItem } from "."
import { eq } from "./testutils"
import { toComputedLedger } from "./to-computed-ledger"

test("returns empty ledger passed empty ledger", (t) => {
  eq(t, toComputedLedger([]), { consumed: {}, ledger: [], left: {} })
})

test("returns ledger item with no gains on single ledger item", (t) => {
  const item: LedgerItem = {
    id: "123",
    date: Temporal.PlainDate.from("2020-01-01"),
    from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 0.1 },
  }
  eq(t, toComputedLedger([item]), {
    consumed: { "123": [] },
    ledger: [{ ...item, taxableGain: 0 }],
    left: {
      A: [{ amount: 10, item, purchaseDate: item.date, unitPriceEur: 0.1 }],
    },
  })
})

test("calculates gains from one full back-forth purchase", (t) => {
  const from: LedgerItem = {
    id: "123",
    date: Temporal.PlainDate.from("2020-01-01"),
    from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 0.1 },
  }
  const to: LedgerItem = {
    id: "124",
    date: Temporal.PlainDate.from("2020-01-02"),
    from: { amount: 10, symbol: "A", unitPriceEur: 0.2 },
    to: { symbol: "EUR", amount: 2, unitPriceEur: 1 },
  }
  eq(t, toComputedLedger([from, to]), {
    consumed: { "123": [], "124": [{ ...from, taxableGain: 1 }] },
    ledger: [
      { ...from, taxableGain: 0 },
      { ...to, taxableGain: 1 },
    ],
    left: {
      A: [],
    },
  })
})

test("calculates gains from half back-forth purchase", (t) => {
  const from: LedgerItem = {
    id: "123",
    date: Temporal.PlainDate.from("2020-01-01"),
    from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 0.1 },
  }
  const to: LedgerItem = {
    id: "124",
    date: Temporal.PlainDate.from("2020-01-02"),
    from: { amount: 5, symbol: "A", unitPriceEur: 0.2 },
    to: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
  }
  eq(t, toComputedLedger([from, to]), {
    consumed: { "123": [], "124": [{ ...from, taxableGain: 0.5 }] },
    ledger: [
      { ...from, taxableGain: 0 },
      { ...to, taxableGain: 0.5 },
    ],
    left: {
      A: [
        { amount: 5, item: from, purchaseDate: from.date, unitPriceEur: 0.1 },
      ],
    },
  })
})
