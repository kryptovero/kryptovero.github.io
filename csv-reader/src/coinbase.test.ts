import test from "ava"
import { readCsv } from "."

const COINBASE_HEADER = `portfolio,trade id,product,side,created at,size,size unit,price,fee,total,price/fee/total unit`
const toCsv = (...rows: string[]) =>
  [COINBASE_HEADER].concat(rows).join("\n").concat("\n")

test("Empty report", (t) => {
  t.deepEqual(readCsv(toCsv()), [])
})

test("Buy BTC with EUR", (t) => {
  eq(
    t,
    readCsv(
      toCsv(
        `default,12345,BTC-EUR,BUY,2021-01-01T00:00:00.000Z,0.001,BTC,10000,0.1,-10,EUR`
      )
    ),
    [
      {
        id: "coinbase_12345",
        timestamp: utcDate("2021-01-01"),
        from: { symbol: "EUR", unitPriceEur: 1, amount: 10 },
        to: { symbol: "BTC", amount: 0.001, unitPriceEur: 10_000 },
        fee: { symbol: "EUR", amount: 0.1 },
      },
    ]
  )
})

test("Sell BTC to EUR", (t) => {
  eq(
    t,
    readCsv(
      toCsv(
        `default,1234,BTC-EUR,SELL,2021-01-01T00:00:00.000Z,0.001,BTC,10000,0.1,10,EUR`
      )
    ),
    [
      {
        id: "coinbase_1234",
        timestamp: utcDate("2021-01-01"),
        from: { symbol: "BTC", amount: 0.001, unitPriceEur: 10_000 },
        to: { symbol: "EUR", unitPriceEur: 1, amount: 10 },
        fee: { symbol: "EUR", amount: 0.1 },
      },
    ]
  )
})

test("Sell ETH to ADA", (t) => {
  eq(
    t,
    readCsv(
      toCsv(
        `default,1234,ADA-ETH,BUY,2021-01-01T00:00:00.000Z,3.25000000,ADA,0.000612,0.000009945,-0.001998945,ETH`
      )
    ),
    [
      {
        id: "coinbase_1234",
        timestamp: utcDate("2021-01-01"),
        from: { symbol: "ETH", amount: 0.001998945 },
        to: { symbol: "ADA", amount: 3.25 },
        fee: { symbol: "ETH", amount: 0.000009945 },
      },
    ]
  )
})

test("Sell ADA to ETH", (t) => {
  eq(
    t,
    readCsv(
      toCsv(
        `default,1234,ADA-ETH,SELL,2021-01-01T00:00:00.000Z,0.001998945,ADA,0.000612,0.000009945,3.25,ETH`
      )
    ),
    [
      {
        id: "coinbase_1234",
        timestamp: utcDate("2021-01-01"),
        from: { symbol: "ADA", amount: 0.001998945 },
        to: { symbol: "ETH", amount: 3.25 },
        fee: { symbol: "ETH", amount: 0.000009945 },
      },
    ]
  )
})

import { ExecutionContext } from "ava"
import { utcDate } from "./testutils"

export const eq = <T>(t: ExecutionContext<unknown>, left: T, right: T) =>
  t.deepEqual(
    JSON.parse(JSON.stringify(left)),
    JSON.parse(JSON.stringify(right))
  )
