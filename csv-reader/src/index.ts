import { Ledger, LedgerItem } from "@fifo/ledger"

export function readCsv(input: string, type: "pro" | "standalone" = "pro"): Ledger {
  return input
    .split("\n")
    .slice(1)
    .filter((row) => row.trim())
    .map((row) => type === "pro" ? parseProRow(row.split(",")) : parseStandaloneRow(row.split(",")))
    .map((row): LedgerItem => {
      const pair = row.product.split("-")
      const fromSymbol = row.side === "BUY" ? pair[1] : pair[0]
      const toSymbol = row.side === "BUY" ? pair[0] : pair[1]
      const fromAmount = row.side === "BUY" ? -row.total : row.size
      const toAmount = row.side === "BUY" ? row.size : row.total
      const fromUnitPriceEur = row.side === "BUY" ? 1 : row.price
      const toUnitPriceEur = row.side === "BUY" ? row.price : 1
      return {
        id: `coinbase_${row.tradeId}`,
        timestamp: row.createdAt,
        from: {
          symbol: fromSymbol,
          amount: fromAmount,
          unitPriceEur:
            row.priceFeeTotalUnit === "EUR" ? fromUnitPriceEur : undefined,
        },
        to: {
          symbol: toSymbol,
          amount: toAmount,
          unitPriceEur:
            row.priceFeeTotalUnit === "EUR" ? toUnitPriceEur : undefined,
        },
        fee: { amount: row.fee, symbol: row.priceFeeTotalUnit },
      }
    })
}

const parseNotes = (notes: string) => {
  const buyRegex = /^Bought ([0-9]*[.]?[0-9]+) (.+) for ($|€)([0-9]*[.]?[0-9]+) ([a-zA-Z]+)$/
  const sellRegex = /^Sold ([0-9]*[.]?[0-9]+) (.+) for ($|€)([0-9]*[.]?[0-9]+) ([a-zA-Z]+)$/

  const convertRegex = /^Converted ([0-9]*[.]?[0-9]+) (.+) to ([0-9]*[.]?[0-9]+) ([a-zA-Z]+)$/

  if(buyRegex.test(notes)) {
    const res = buyRegex.exec(notes)
    if(!res) {
      throw new Error("Failed to parse")
    }
    const [_first, _toCurrencyAmount, toCurrency, _fromCurrencySymbol, _fromCurrencyAmount, fromCurrency, ...rest] = res
    return {
      product: `${toCurrency}-${fromCurrency}`,
      side: "BUY"
    } as const
  }

  if(sellRegex.test(notes)) {
    const res = sellRegex.exec(notes)
    if(!res) {
      throw new Error("Failed to parse")
    }
    const [_first, _fromCurrencyAmount, fromCurrency, _toCurrencySymbol, _toCurrencyAmount, toCurrency, ...rest] = res
    return {
      product: `${fromCurrency}-${toCurrency}`,
      side: "SELL"
    } as const
  }

  if(convertRegex.test(notes)) {
    const res = convertRegex.exec(notes)
    if(!res) {
      throw new Error("Failed to parse")
    }
    const [_first, _fromCurrencyAmount, fromCurrency, _toCurrencyAmount, toCurrency, ...rest] = res
    return {
      product: `${fromCurrency}-${toCurrency}`,
      side: "SELL"
    } as const
  }

  throw new Error("Unknown error")
}

function parseProRow(strRow: string[]) {
  const [
    portfolio,
    tradeId,
    product,
    side,
    createdAt,
    size,
    sizeUnit,
    price,
    fee,
    total,
    priceFeeTotalUnit,
  ] = strRow
  return {
    portfolio,
    tradeId: parseInt(tradeId, 10),
    product,
    side: side as "BUY" | "SELL",
    createdAt: Date.parse(createdAt),
    size: parseFloat(size),
    sizeUnit,
    price: parseFloat(price),
    fee: parseFloat(fee),
    total: parseFloat(total),
    priceFeeTotalUnit,
  } as const
}

function parseStandaloneRow(strRow: string[]) {
  const [
    timestamp, _transactionType, asset, quantityTransacted, eurSpotPrice, eurSubtotal, eurTotal, eurFees, notes
  ] = strRow
  const { side, product } = parseNotes(notes)
  return {
    portfolio: "default",
    tradeId: `${side}_${product}_${timestamp}`,
    product,
    side: side as "BUY" | "SELL",
    createdAt: Temporal.PlainDate.from(timestamp.slice(0, 10)),
    size: parseFloat(quantityTransacted),
    sizeUnit: asset,
    price: parseFloat(eurSpotPrice),
    fee: parseFloat(eurFees),
    total: side === "BUY" ? -parseFloat(eurTotal) : parseFloat(eurTotal),
    priceFeeTotalUnit: "EUR",
  } as const
}
