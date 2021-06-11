import { LedgerItem, LedgerSnapshot } from "."
import assert from "assert"

export const step = (
  snapshot: LedgerSnapshot,
  item: LedgerItem
): LedgerSnapshot => {
  const currFrom = snapshot[item.from.symbol] ?? []
  const currTo = snapshot[item.to.symbol] ?? []

  // TODO: Refactor to recursion
  let remaining = item.from.amount
  const newFrom: typeof currFrom = []
  for (const item of currFrom) {
    if (remaining >= item.amount) {
      remaining -= item.amount
    } else {
      newFrom.push({ ...item, amount: item.amount - remaining })
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

  assert((item.to.unitPriceEur ?? item.from.unitPriceEur) !== undefined)

  const toUnitPriceEur =
    item.to.unitPriceEur ??
    (item.from.unitPriceEur! * item.from.amount) / item.to.amount

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
