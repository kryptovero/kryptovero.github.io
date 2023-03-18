import test from "ava"
import { readCsv } from "."

const COINBASE_PRO_HEADER = `portfolio,trade id,product,side,created at,size,size unit,price,fee,total,price/fee/total unit`
const toProCsv = (...rows: string[]) =>
  [COINBASE_PRO_HEADER].concat(rows).join("\n").concat("\n")

const COINBASE_HEADER = `Timestamp,Transaction Type,Asset,Quantity Transacted,EUR Spot Price at Transaction,EUR Subtotal,EUR Total (inclusive of fees),EUR Fees,Notes`
const toCsv = (...rows: string[]) =>
    [COINBASE_HEADER].concat(rows).join("\n").concat("\n")

test("[Coinbase Pro] Empty report", (t) => {
  t.deepEqual(readCsv(toProCsv()), [])
})

test("[Coinbase Standalone] Buy BTC with EUR", (t) => {
  eq(
    t,
    readCsv(
      toCsv(
        `2021-01-14T06:03:55Z,Buy,BTC,55.555,40000.55,20.51,500.00,10.88,Bought 55.555 BTC for €500.00 EUR`
      ), "standalone"
    ),
    [
      {
        id: "coinbase_BUY_BTC-EUR_2021-01-14T06:03:55Z",
        date: Temporal.PlainDate.from("2021-01-14"),
        from: { symbol: "EUR", unitPriceEur: 1, amount: 500 },
        to: { symbol: "BTC", amount: 55.555, unitPriceEur: 40_000.55 },
        fee: { symbol: "EUR", amount: 10.88 },
      },
    ]
  )
})

test("[Coinbase Standalone] Sell BTC to EUR", (t) => {
  eq(
    t,
    readCsv(
      toCsv(
        `2021-01-01T00:00:00.000Z,Sell,BTC,0.001,40000,20.51,22.00,1.49,Sold 0.00066064 BTC for €22.00 EUR`
      ), "standalone"
    ),
    [
      {
        id: "coinbase_SELL_BTC-EUR_2021-01-01T00:00:00.000Z",
        date: Temporal.PlainDate.from("2021-01-01"),
        from: { symbol: "BTC", amount: 0.001, unitPriceEur: 40_000 },
        to: { symbol: "EUR", unitPriceEur: 1, amount: 22 },
        fee: { symbol: "EUR", amount: 1.49 },
      },
    ]
  )
})

test("[Coinbase Pro] Buy BTC with EUR", (t) => {
  eq(
    t,
    readCsv(
      toProCsv(
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

test("[Coinbase Pro] Sell BTC to EUR", (t) => {
  eq(
    t,
    readCsv(
      toProCsv(
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

test("[Coinbase Pro] Sell ETH to ADA", (t) => {
  eq(
    t,
    readCsv(
      toProCsv(
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

test("[Coinbase Pro] Sell ADA to ETH", (t) => {
  eq(
    t,
    readCsv(
      toProCsv(
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
