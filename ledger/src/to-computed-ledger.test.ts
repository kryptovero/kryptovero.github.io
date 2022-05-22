import test from "ava"
import { Ledger, LedgerItem } from "."
import { eq, utcDate } from "./testutils"
import { toComputedLedger } from "./to-computed-ledger"

test("returns empty ledger passed empty ledger", (t) => {
  eq(t, toComputedLedger([]), { consumed: {}, ledger: [], left: {} })
})

test("returns ledger item with no gains on single ledger item", (t) => {
  const item: LedgerItem = {
    id: "123",
    timestamp: utcDate("2020-01-01"),
    from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 0.1 },
  }
  eq(t, toComputedLedger([item]), {
    consumed: { "123": [] },
    ledger: [{ ...item, taxableGain: 0, buyPrice: 0, sellPrice: 0, fees: 0 }],
    left: {
      A: [
        {
          amount: 10,
          item,
          purchaseTimestamp: item.timestamp,
          unitPriceEur: 0.1,
        },
      ],
    },
  })
})

test("calculates gains from one full back-forth purchase", (t) => {
  const from: LedgerItem = {
    id: "123",
    timestamp: utcDate("2020-01-01"),
    from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 0.1 },
  }
  const to: LedgerItem = {
    id: "124",
    timestamp: utcDate("2020-01-02"),
    from: { amount: 10, symbol: "A", unitPriceEur: 0.2 },
    to: { symbol: "EUR", amount: 2, unitPriceEur: 1 },
  }
  eq(t, toComputedLedger([from, to]), {
    consumed: { "123": [], "124": [{ ...from, taxableGain: 1 }] },
    ledger: [
      { ...from, taxableGain: 0, buyPrice: 0, sellPrice: 0, fees: 0 },
      { ...to, taxableGain: 1, buyPrice: 0, sellPrice: 0, fees: 0 },
    ],
    left: {
      A: [],
    },
  })
})

test("calculates gains from half back-forth purchase", (t) => {
  const from: LedgerItem = {
    id: "123",
    timestamp: utcDate("2020-01-01"),
    from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 0.1 },
  }
  const to: LedgerItem = {
    id: "124",
    timestamp: utcDate("2020-01-02"),
    from: { amount: 5, symbol: "A", unitPriceEur: 0.2 },
    to: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
  }
  eq(t, toComputedLedger([from, to]), {
    consumed: {
      "123": [],
      "124": [
        {
          ...from,
          from: { symbol: "EUR", amount: 0.5, unitPriceEur: 1 },
          to: { amount: 5, symbol: "A", unitPriceEur: 0.1 },
          taxableGain: 0.5,
        },
      ],
    },
    ledger: [
      { ...from, taxableGain: 0, buyPrice: 0, sellPrice: 0, fees: 0 },
      { ...to, taxableGain: 0.5, buyPrice: 0, sellPrice: 0, fees: 0 },
    ],
    left: {
      A: [
        {
          amount: 5,
          item: from,
          purchaseTimestamp: from.timestamp,
          unitPriceEur: 0.1,
        },
      ],
    },
  })
})

test("Reduces all selling fees from gains when selling full amount", (t) => {
  const from: LedgerItem = {
    id: "123",
    timestamp: utcDate("2020-01-01"),
    from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 0.1 },
  }
  const to: LedgerItem = {
    id: "124",
    timestamp: utcDate("2020-01-02"),
    from: { amount: 10, symbol: "A", unitPriceEur: 0.2 },
    to: { symbol: "EUR", amount: 2, unitPriceEur: 1 },
    fee: { symbol: "EUR", amount: 0.1, unitPriceEur: 1 },
  }

  eq(t, toComputedLedger([from, to]), {
    consumed: { "123": [], "124": [{ ...from, taxableGain: 0.9 }] },
    ledger: [
      { ...from, taxableGain: 0, buyPrice: 0, sellPrice: 0, fees: 0 },
      { ...to, taxableGain: 0.9, buyPrice: 0, sellPrice: 0, fees: 0 },
    ],
    left: {
      A: [],
    },
  })
})

test("Reduces all selling fees + all purchase fees from gains when selling full amount", (t) => {
  const from: LedgerItem = {
    id: "123",
    timestamp: utcDate("2020-01-01"),
    from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 0.1 },
    fee: { symbol: "EUR", amount: 0.1, unitPriceEur: 1 },
  }
  const to: LedgerItem = {
    id: "124",
    timestamp: utcDate("2020-01-02"),
    from: { amount: 10, symbol: "A", unitPriceEur: 0.2 },
    to: { symbol: "EUR", amount: 2, unitPriceEur: 1 },
    fee: { symbol: "EUR", amount: 0.1, unitPriceEur: 1 },
  }

  eq(t, toComputedLedger([from, to]), {
    consumed: { "123": [], "124": [{ ...from, taxableGain: 0.8 }] },
    ledger: [
      { ...from, taxableGain: 0, buyPrice: 0, sellPrice: 0, fees: 0 },
      { ...to, taxableGain: 0.8, buyPrice: 0, sellPrice: 0, fees: 0 },
    ],
    left: {
      A: [],
    },
  })
})

test("Reduces all selling fees + partial of purchase fees from gains when selling partial amount", (t) => {
  const from: LedgerItem = {
    id: "123",
    timestamp: utcDate("2020-01-01"),
    from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 0.1 },
    fee: { symbol: "EUR", amount: 0.1, unitPriceEur: 1 },
  }
  const to: LedgerItem = {
    id: "124",
    timestamp: utcDate("2020-01-02"),
    from: { amount: 5, symbol: "A", unitPriceEur: 0.2 },
    to: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    fee: { symbol: "EUR", amount: 0.1, unitPriceEur: 1 },
  }

  const fees = 0.1 + 0.1 * 0.5
  eq(t, toComputedLedger([from, to]), {
    consumed: {
      "123": [],
      "124": [
        {
          ...from,
          from: { symbol: "EUR", amount: 0.5, unitPriceEur: 1 },
          to: { amount: 5, symbol: "A", unitPriceEur: 0.1 },
          fee: { amount: 0.05, symbol: "EUR", unitPriceEur: 1 },
          taxableGain: 0.5 - fees,
        },
      ],
    },
    ledger: [
      { ...from, taxableGain: 0, buyPrice: 0, sellPrice: 0, fees: 0 },
      { ...to, taxableGain: 0.5 - fees, buyPrice: 0, sellPrice: 0, fees: 0 },
    ],
    left: {
      A: [
        {
          amount: 5,
          item: from,
          purchaseTimestamp: from.timestamp,
          unitPriceEur: 0.1,
        },
      ],
    },
  })
})

test("Reduces all selling fees + partial of last purchase fee + all of first purchase fee from gains when selling partial amount of two purchases", (t) => {
  const from1: LedgerItem = {
    id: "123",
    timestamp: utcDate("2020-01-01"),
    from: { symbol: "EUR", amount: 10, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 1 },
    fee: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
  }
  const from2: LedgerItem = {
    id: "124",
    timestamp: utcDate("2020-01-02"),
    from: { symbol: "EUR", amount: 20, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 2 },
    fee: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
  }
  const to: LedgerItem = {
    id: "125",
    timestamp: utcDate("2020-01-03"),
    from: { amount: 16, symbol: "A", unitPriceEur: 2.5 },
    to: { symbol: "EUR", amount: 40, unitPriceEur: 1 },
    fee: { symbol: "EUR", amount: 1.6, unitPriceEur: 1 },
  }

  /**
   * Buy 10pcs á 1€, fee 1€
   * Buy 10pcs á 2€, fee 1€
   * Sell 16pcs á 2.5€, fee 1.6€
   *
   * --> sell:
   * 10pcs (= 10/16 = 0.625) á 1€ --> á 2.5€, fee 1€ + 1€
   * 6kpl (= 6/16 = 0.375) á 2€ --> á 2.5€, fee 0.6€ + 0.6€
   *
   * ====
   * 10 * 1.5€ profit = 15€
   * 15€ - fees 2€ = 13€
   *
   * 6 * 0.5€ profit = 3€
   * 3€ - feet 1.2€ = 1.8€ gains
   */
  const from1PartOfSell = from1.to.amount / to.from.amount
  const from1Profit =
    (to.from.unitPriceEur! - from1.to.unitPriceEur!) * from1.to.amount
  const from1Fee = from1.fee!.amount + to.fee!.amount * from1PartOfSell
  const from1Gains = from1Profit - from1Fee

  const from2PartOfSell = (to.from.amount - from1.from.amount) / to.from.amount
  const from2PartOfBuy = (to.from.amount - from1.to.amount) / from2.to.amount
  const from2Profit =
    (to.from.unitPriceEur! - from2.to.unitPriceEur!) *
    (to.from.amount - from1.to.amount)
  const from2Fee =
    from2.fee!.amount * from2PartOfBuy + to.fee!.amount * from2PartOfSell
  const from2Gains = from2Profit - from2Fee

  eq(t, toComputedLedger([from1, from2, to]), {
    consumed: {
      "123": [],
      "124": [],
      "125": [
        { ...from1, taxableGain: from1Gains },
        {
          ...from2,
          to: { ...from2.to, amount: 6 },
          from: { ...from2.from, amount: 12 },
          fee: { ...from2.fee!, amount: 0.6 },
          taxableGain: from2Gains,
        },
      ],
    },
    ledger: [
      { ...from1, taxableGain: 0, buyPrice: 0, sellPrice: 0, fees: 0 },
      { ...from2, taxableGain: 0, buyPrice: 0, sellPrice: 0, fees: 0 },
      {
        ...to,
        taxableGain: from1Gains + from2Gains,
        buyPrice: 0,
        sellPrice: 0,
        fees: 0,
      },
    ],
    left: {
      A: [
        {
          amount: 4,
          item: from2,
          purchaseTimestamp: from2.timestamp,
          unitPriceEur: from2.to.unitPriceEur!,
        },
      ],
    },
  })
})

test("Does not reduce fees if unitPriceEur is not known", (t) => {
  const from: LedgerItem = {
    id: "123",
    timestamp: utcDate("2020-01-01"),
    from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    to: { amount: 10, symbol: "A", unitPriceEur: 0.1 },
    fee: { amount: 100, symbol: "C" },
  }
  const to1: LedgerItem = {
    id: "124",
    timestamp: utcDate("2020-01-02"),
    from: { amount: 5, symbol: "A", unitPriceEur: 0.2 },
    to: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    fee: { symbol: "B", amount: 0.01, unitPriceEur: 5 },
  }
  const to2: LedgerItem = {
    id: "125",
    timestamp: utcDate("2020-01-03"),
    from: { amount: 5, symbol: "A", unitPriceEur: 0.2 },
    to: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    fee: { symbol: "B", amount: 0.01, unitPriceEur: 5 },
  }

  eq(t, toComputedLedger([from, to1, to2]), {
    consumed: {
      "123": [],
      "124": [
        {
          ...from,
          from: { ...from.from, amount: 0.5 },
          to: { ...from.to, amount: 5 },
          fee: { ...from.fee!, amount: 50 },
          taxableGain: 0.45,
        },
      ],
      "125": [{ ...from, taxableGain: 0.45 }],
    },
    ledger: [
      { ...from, taxableGain: 0, buyPrice: 0, sellPrice: 0, fees: 0 },
      { ...to1, taxableGain: 0.45, buyPrice: 0, sellPrice: 0, fees: 0 },
      { ...to2, taxableGain: 0.45, buyPrice: 0, sellPrice: 0, fees: 0 },
    ],
    left: {
      A: [],
    },
  })
})

test("Throws an error if trying to sell nonexisting coins", (t) => {
  const ledger: Ledger = [
    {
      id: "123",
      timestamp: utcDate("2020-01-01"),
      from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
      to: { symbol: "A", amount: 10 },
    },
    {
      id: "124",
      timestamp: utcDate("2020-01-02"),
      from: { symbol: "A", amount: 20 },
      to: { symbol: "EUR", amount: 100, unitPriceEur: 1 },
    },
  ]

  t.throws(() => toComputedLedger(ledger))
})
