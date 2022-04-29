import test from "ava"
import { ExecutionContext } from "ava"
import { utcDate } from "../testutils"
import { readBuySellCsv, readTradeCsv } from "./binance"

const BINANCE_TRADE_HEADER =
  "Date(UTC);Market;Type;Price;Amount;Total;Fee;Fee Coin"
const BINANCE_BUYSELL_HEADER =
  "Date(UTC);Method;Amount;Price;Fees;Final Amount;Status;Transaction ID"

const toCsv = (header: string, ...rows: string[]) =>
  [header].concat(rows).join("\r\n").concat("\r\n")

test("Empty report", (t) => {
  t.deepEqual(readTradeCsv(toCsv(BINANCE_TRADE_HEADER)), [])
})

test("TRADE: Sell BTC for USDT", (t) => {
  t.deepEqual(
    readTradeCsv(
      toCsv(
        BINANCE_TRADE_HEADER,
        `2021-10-03 13:53:53;BTCUSDT;SELL;48096.6;0.00043;20.681538;0.02068154;USDT`
      )
    ),
    [
      {
        id: "binance_trade_2021-10-03T13:53:53.000Z",
        timestamp: Date.parse("2021-10-03T13:53:53.000Z"),
        from: { symbol: "BTC", amount: 0.00043, unitPriceEur: undefined },
        to: { symbol: "USDT", amount: 20.681538, unitPriceEur: undefined },
        fee: { symbol: "USDT", amount: 0.02068154 },
      },
    ]
  )
})

test("TRADE: Sell LTC for BTC", (t) => {
  t.deepEqual(
    readTradeCsv(
      toCsv(
        BINANCE_TRADE_HEADER,
        `2021-10-03 13:32:06;LTCBTC;SELL;0.00001078;5;0.0000539;0.00000005;BTC`
      )
    ),
    [
      {
        id: "binance_trade_2021-10-03T13:32:06.000Z",
        timestamp: Date.parse("2021-10-03T13:32:06.000Z"),
        from: { symbol: "LTC", amount: 5, unitPriceEur: undefined },
        to: { symbol: "BTC", amount: 0.0000539, unitPriceEur: undefined },
        fee: { symbol: "BTC", amount: 0.00000005 },
      },
    ]
  )
})

test("TRADE: Buy LTC with BTC", (t) => {
  t.deepEqual(
    readTradeCsv(
      toCsv(
        BINANCE_TRADE_HEADER,
        `2021-10-03 13:09:07;LTCBTC;BUY;0.00001085;20;0.000217;0.02;LTC`
      )
    ),
    [
      {
        id: "binance_trade_2021-10-03T13:09:07.000Z",
        timestamp: Date.parse("2021-10-03T13:09:07.000Z"),
        from: { symbol: "BTC", amount: 0.000217, unitPriceEur: undefined },
        to: { symbol: "LTC", amount: 20, unitPriceEur: undefined },
        fee: { symbol: "LTC", amount: 0.02 },
      },
    ]
  )
})

test("BUY: Buy BTC with EUR", (t) => {
  t.deepEqual(
    readBuySellCsv(
      toCsv(
        BINANCE_BUYSELL_HEADER,
        `2021-10-03 11:31:19;Cash Balance;49.10 EUR;41266.053 BTC/EUR;0.00 EUR;0.00118984 BTC;Completed;foobarbazidentifier`
      )
    ),
    [
      {
        id: "binance_buysell_foobarbazidentifier",
        timestamp: Date.parse("2021-10-03T11:31:19.000Z"),
        from: { symbol: "EUR", amount: 49.1 },
        to: { symbol: "BTC", amount: 0.00118984 },
        fee: { symbol: "EUR", amount: 0.0 },
      },
    ]
  )
})
