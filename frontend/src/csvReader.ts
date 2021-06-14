import { Temporal } from "proposal-temporal";
import { Ledger, LedgerItem } from "../../ledger/build";

export function readCsv(input: string): Ledger {
  return input
    .split("\n")
    .slice(1)
    .filter((row) => row.trim())
    .map((row) => parseRow(row.split(",")))
    .map((row): LedgerItem => {
      const pair = row.product.split("-");
      const fromSymbol = row.side === "BUY" ? pair[1] : pair[0];
      const toSymbol = row.side === "BUY" ? pair[0] : pair[1];
      const fromAmount = row.side === "BUY" ? -row.total : row.size;
      const toAmount = row.side === "BUY" ? row.size : row.total;
      const fromUnitPriceEur = row.side === "BUY" ? 1 : row.price;
      const toUnitPriceEur = row.side === "BUY" ? row.price : 1;
      debugger;
      return {
        date: row.createdAt,
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
      };
    });
}

function parseRow(strRow: string[]) {
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
  ] = strRow;
  return {
    portfolio,
    tradeId: parseInt(tradeId, 10),
    product,
    side: side as "BUY" | "SELL",
    createdAt: Temporal.PlainDate.from(createdAt.slice(0, 10)),
    size: parseFloat(size),
    sizeUnit,
    price: parseFloat(price),
    fee: parseFloat(fee),
    total: parseFloat(total),
    priceFeeTotalUnit,
  } as const;
}
