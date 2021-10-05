import { Temporal } from "proposal-temporal"
import { Ledger, LedgerItem } from "@fifo/ledger"
import * as B from "@fifo/csv-reader/src/binance/markets-symbols"

// Note:
// Binance has separate export mechanisms for trades and crypto bought/sold with fiat currency,
// And the CSV header is different for each.

const COLUMN_DELIMITER = ";"

export function readTradeCsv(input: string): Ledger {
  return input
    .split(input.includes("\r\n") ? "\r\n" : "\n")
    .slice(1)
    .filter((row) => row.trim())
    .map((row) => parseTradeRow(row.split(COLUMN_DELIMITER)))
    .map((row): LedgerItem => {
      const marketInfo = B.BINANCE_MARKETS[row.market as B.BinanceMarket]
      const [fromSymbol, toSymbol] =
        row.type === "BUY"
          ? [marketInfo.quoteAsset, marketInfo.baseAsset]
          : [marketInfo.baseAsset, marketInfo.quoteAsset]
      const [fromAmount, toAmount] =
        row.type === "BUY" ? [row.total, row.amount] : [row.amount, row.total]
      const fromUnitPriceEur = row.type === "BUY" ? 1 : row.price
      const toUnitPriceEur = row.type === "BUY" ? row.price : 1
      return {
        id: `binance_trade_${row.createdAt.toString()}`,
        date: row.createdAt.toPlainDate(),
        from: {
          symbol: fromSymbol,
          amount: fromAmount,
          unitPriceEur: row.feeCoin === "EUR" ? fromUnitPriceEur : undefined,
        },
        to: {
          symbol: toSymbol,
          amount: toAmount,
          unitPriceEur: row.feeCoin === "EUR" ? toUnitPriceEur : undefined,
        },
        fee: { amount: row.fee, symbol: row.feeCoin },
      }
    })
}

export function readBuySellCsv(input: string): Ledger {
  return input
    .split(input.includes("\r\n") ? "\r\n" : "\n")
    .slice(1)
    .filter((row) => row.trim())
    .map((row) => parseBuySellRow(row.split(COLUMN_DELIMITER)))
    .map((row): LedgerItem => {
      // TODO: omitting the unitPriceEurs from this since i'm unsure what's correct.
      return {
        id: `binance_buysell_${row.id}`,
        date: row.createdAt.toPlainDate(),
        from: {
          symbol: row.fromCoin,
          amount: row.fromAmount,
        },
        to: {
          symbol: row.toCoin,
          amount: row.toAmount,
        },
        fee: { amount: row.fee, symbol: row.feeCoin },
      }
    })
}

// Date(UTC);Market;Type;Price;Amount;Total;Fee;Fee Coin
export function parseTradeRow(strRow: string[]) {
  const [dateUTC, market, type, price, amount, total, fee, feeCoin] = strRow
  return {
    createdAt: Temporal.PlainDateTime.from(dateUTC),
    market,
    type: type as "BUY" | "SELL",
    amount: parseFloat(amount),
    total: parseFloat(total),
    price: parseFloat(price),
    fee: parseFloat(fee),
    feeCoin,
  } as const
}

// Date(UTC);Method;Amount;Price;Fees;Final Amount;Status;Transaction ID
export function parseBuySellRow(strRow: string[]) {
  const [
    dateUTC,
    method,
    amount,
    price,
    fees,
    finalAmount,
    status,
    transactionId,
  ] = strRow

  const [fromAmount, fromCoin] = amount.split(" ")
  const [toAmount, toCoin] = finalAmount.split(" ")
  const [fee, feeCoin] = fees.split(" ")
  return {
    id: transactionId,
    createdAt: Temporal.PlainDateTime.from(dateUTC),
    method,
    status,
    fromAmount: parseFloat(fromAmount),
    fromCoin,
    toAmount: parseFloat(toAmount),
    toCoin,
    price: parseFloat(price.split(" ").shift()!),
    fee: parseFloat(fee),
    feeCoin,
  }
}
