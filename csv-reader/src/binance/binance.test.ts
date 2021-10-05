import test from "ava"
import { Temporal } from "proposal-temporal"
import { ExecutionContext } from "ava"
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
  eq(
    t,
    readTradeCsv(
      toCsv(
        BINANCE_TRADE_HEADER,
        `2021-10-03 13:53:53;BTCUSDT;SELL;48096.6;0.00043;20.681538;0.02068154;USDT`
      )
    ),
    [
      {
        id: "binance_trade_2021-10-03T13:53:53",
        date: Temporal.PlainDate.from("2021-10-03"),
        from: { symbol: "BTC", amount: 0.00043 },
        to: { symbol: "USDT", amount: 20.681538 },
        fee: { symbol: "USDT", amount: 0.02068154 },
      },
    ]
  )
})

test("TRADE: Sell LTC for BTC", (t) => {
  eq(
    t,
    readTradeCsv(
      toCsv(
        BINANCE_TRADE_HEADER,
        `2021-10-03 13:32:06;LTCBTC;SELL;0.00001078;5;0.0000539;0.00000005;BTC`
      )
    ),
    [
      {
        id: "binance_trade_2021-10-03T13:32:06",
        date: Temporal.PlainDate.from("2021-10-03"),
        from: { symbol: "LTC", amount: 5 },
        to: { symbol: "BTC", amount: 0.0000539 },
        fee: { symbol: "BTC", amount: 0.00000005 },
      },
    ]
  )
})

test("TRADE: Buy LTC with BTC", (t) => {
  eq(
    t,
    readTradeCsv(
      toCsv(
        BINANCE_TRADE_HEADER,
        `2021-10-03 13:09:07;LTCBTC;BUY;0.00001085;20;0.000217;0.02;LTC`
      )
    ),
    [
      {
        id: "binance_trade_2021-10-03T13:09:07",
        date: Temporal.PlainDate.from("2021-10-03"),
        from: { symbol: "BTC", amount: 0.000217 },
        to: { symbol: "LTC", amount: 20 },
        fee: { symbol: "LTC", amount: 0.02 },
      },
    ]
  )
})

test("BUY: Buy BTC with EUR", (t) => {
  eq(
    t,
    readBuySellCsv(
      toCsv(
        BINANCE_BUYSELL_HEADER,
        `2021-10-03 11:31:19;Cash Balance;49.10 EUR;41266.053 BTC/EUR;0.00 EUR;0.00118984 BTC;Completed;foobarbazidentifier`
      )
    ),
    [
      {
        id: "binance_buysell_foobarbazidentifier",
        date: Temporal.PlainDate.from("2021-10-03"),
        from: { symbol: "EUR", amount: 49.1 },
        to: { symbol: "BTC", amount: 0.00118984 },
        fee: { symbol: "EUR", amount: 0.0 },
      },
    ]
  )
})

export const eq = <T>(t: ExecutionContext<unknown>, left: T, right: T) =>
  t.deepEqual(
    JSON.parse(JSON.stringify(left)),
    JSON.parse(JSON.stringify(right))
  )
