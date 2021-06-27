import test from "ava"
import { Temporal } from "proposal-temporal"
import { step } from "./step"
import { eq } from "./testutils"

test("step should add item to empty snapshot", (t) => {
  eq(
    t,
    step(
      {},
      {
        id: "1",
        date: Temporal.PlainDate.from("2020-01-01"),
        from: { amount: 10, symbol: "EUR", unitPriceEur: 1 },
        to: { amount: 10, symbol: "A", unitPriceEur: 1 },
      }
    ).snapshot,
    {
      EUR: [
        {
          amount: -10,
          purchaseDate: Temporal.PlainDate.from("2020-01-01"),
          unitPriceEur: 1,
        },
      ],
      A: [
        {
          purchaseDate: Temporal.PlainDate.from("2020-01-01"),
          amount: 10,
          unitPriceEur: 1,
        },
      ],
    }
  )
})

test("Should reduce amount when selling", (t) => {
  eq(
    t,
    step(
      {
        A: [
          {
            amount: 10,
            purchaseDate: Temporal.PlainDate.from("2020-01-01"),
            unitPriceEur: 1,
          },
        ],
      },
      {
        id: "1",
        date: Temporal.PlainDate.from("2020-02-01"),
        from: { amount: 5, symbol: "A", unitPriceEur: 1 },
        to: { amount: 5, symbol: "EUR", unitPriceEur: 1 },
      }
    ).snapshot,
    {
      A: [
        {
          amount: 5,
          purchaseDate: Temporal.PlainDate.from("2020-01-01"),
          unitPriceEur: 1,
        },
      ],
      EUR: [
        {
          amount: 5,
          purchaseDate: Temporal.PlainDate.from("2020-02-01"),
          unitPriceEur: 1,
        },
      ],
    }
  )
})
