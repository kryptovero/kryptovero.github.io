import { Ledger, LedgerItem } from "@fifo/ledger"

export function readCsv(input: string): Ledger {
  return input
    .split("\n")
    .slice(1)
    .filter((row) => row.trim())
    .map((row) => parseRow(row.split(",")))
    .filter((row) => row.type === "Buy" || row.type === "Sell")
    .map((row, i): LedgerItem => {
      const fromSymbol = row.type === "Buy" ? "EUR" : row.symbol
      const toSymbol = row.type === "Buy" ? row.symbol : "EUR"
      const fromAmount = row.type === "Buy" ? -row.value : row.quantity
      const toAmount = row.type === "Buy" ? row.quantity : row.value
      const fromUnitPriceEur = row.type === "Buy" ? 1 : row.price
      const toUnitPriceEur = row.type === "Buy" ? row.price : 1
      return {
        id: `revoolutx_${i}`,
        timestamp: row.date.getTime(),
        from: {
          symbol: fromSymbol,
          amount: fromAmount,
          unitPriceEur: fromUnitPriceEur,
        },
        to: {
          symbol: toSymbol,
          amount: toAmount,
          unitPriceEur: toUnitPriceEur,
        },
        fee: { amount: row.fees, symbol: "EUR" },
      }
    })
}

function parseRow(strRow: string[]) {
  const [symbol, type, quantity, price, value, fees, date] = strRow
  return {
    symbol,
    type: type as "Buy" | "Sell" | "Send" | "Receive",
    quantity: parseFloat(quantity),
    price: parseFloat(price.slice(1)),
    value: parseFloat(value.slice(1)),
    fees: parseFloat(fees.slice(1)),
    date: new Date(Date.parse(date)),
  } as const
}
