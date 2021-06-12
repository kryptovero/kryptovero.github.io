import { LedgerItem, LedgerSnapshot, TaxInfo } from "."

const calculateToUnitPrice = (item: LedgerItem, purchaseSumEur: number) => {
  if (item.to.unitPriceEur !== undefined) return item.to.unitPriceEur
  if (item.from.unitPriceEur !== undefined)
    return (item.from.unitPriceEur * item.from.amount) / item.to.amount
  return purchaseSumEur / item.to.amount
}

type StepResult = { taxGains: TaxInfo[]; snapshot: LedgerSnapshot }

export const step = (
  snapshot: LedgerSnapshot,
  ledgerItem: LedgerItem
): StepResult => {
  const currFrom = snapshot[ledgerItem.from.symbol] ?? []
  const currTo = snapshot[ledgerItem.to.symbol] ?? []

  // TODO: Refactor to recursion
  let remaining = ledgerItem.from.amount
  let purchaseSumEur = 0
  const newFrom: typeof currFrom = []
  const taxGains: TaxInfo[] = []
  const knownToUnitPrice = calculateToUnitPrice(ledgerItem, 0)
  for (const item of currFrom) {
    if (remaining >= item.amount) {
      remaining -= item.amount
      purchaseSumEur += item.amount * item.unitPriceEur
      if (ledgerItem.from.symbol !== "EUR" && knownToUnitPrice)
        taxGains.push({
          fromEur: item.amount * item.unitPriceEur,
          toEur:
            (item.amount / ledgerItem.from.amount) *
            ledgerItem.to.amount *
            knownToUnitPrice,
          fromDate: item.purchaseDate,
          toDate: ledgerItem.date,
        })
    } else {
      newFrom.push({ ...item, amount: item.amount - remaining })
      purchaseSumEur += remaining * item.unitPriceEur
      if (ledgerItem.from.symbol !== "EUR" && knownToUnitPrice && remaining > 0)
        taxGains.push({
          fromEur: remaining * item.unitPriceEur,
          toEur:
            (remaining / ledgerItem.from.amount) *
            ledgerItem.to.amount *
            knownToUnitPrice,
          fromDate: item.purchaseDate,
          toDate: ledgerItem.date,
        })
      remaining = 0
    }
  }
  if (remaining) {
    newFrom.push({
      amount: -remaining,
      purchaseDate: ledgerItem.date,
      unitPriceEur: ledgerItem.from.unitPriceEur!,
    })
  }

  const toUnitPriceEur = calculateToUnitPrice(ledgerItem, purchaseSumEur)

  return {
    snapshot: {
      ...snapshot,
      [ledgerItem.from.symbol]: newFrom,
      [ledgerItem.to.symbol]: [
        ...currTo,
        {
          amount: ledgerItem.to.amount,
          purchaseDate: ledgerItem.date,
          unitPriceEur: toUnitPriceEur,
        },
      ],
    },
    taxGains,
  }
}
