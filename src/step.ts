import { LedgerItem, LedgerSnapshot } from "."

const calculateToUnitPrice = (item: LedgerItem, purchaseSumEur: number) => {
  if (item.to.unitPriceEur !== undefined) return item.to.unitPriceEur
  if (item.from.unitPriceEur !== undefined)
    return (item.from.unitPriceEur * item.from.amount) / item.to.amount
  return purchaseSumEur / item.to.amount
}

export const step = (
  snapshot: LedgerSnapshot,
  item: LedgerItem
): LedgerSnapshot => {
  const currFrom = snapshot[item.from.symbol] ?? []
  const currTo = snapshot[item.to.symbol] ?? []

  // TODO: Refactor to recursion
  let remaining = item.from.amount
  let purchaseSumEur = 0
  const newFrom: typeof currFrom = []
  for (const item of currFrom) {
    if (remaining >= item.amount) {
      remaining -= item.amount
      purchaseSumEur += item.amount * item.unitPriceEur
    } else {
      newFrom.push({ ...item, amount: item.amount - remaining })
      purchaseSumEur += remaining * item.unitPriceEur
      remaining = 0
    }
  }
  if (remaining) {
    newFrom.push({
      amount: -remaining,
      purchaseDate: item.date,
      unitPriceEur: item.from.unitPriceEur!,
    })
  }

  const toUnitPriceEur = calculateToUnitPrice(item, purchaseSumEur)

  return {
    ...snapshot,
    [item.from.symbol]: newFrom,
    [item.to.symbol]: [
      ...currTo,
      {
        amount: item.to.amount,
        purchaseDate: item.date,
        unitPriceEur: toUnitPriceEur,
      },
    ],
  }
}
