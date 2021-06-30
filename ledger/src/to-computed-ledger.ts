import { Temporal } from "proposal-temporal"
import { calculateTax, Coin, Ledger, LedgerItem, sortLedger, TaxInfo } from "."

export type ComputedLedgerItem = LedgerItem & {
  taxableGain: number
}

type ConsumedLedgerItem = {
  amount: number
  purchaseDate: Temporal.PlainDate
  unitPriceEur: number
  item: LedgerItem
}

export type ComputedLedger = {
  ledger: ComputedLedgerItem[]
  consumed: Record<LedgerItem["id"], ComputedLedgerItem[]>
  left: Record<Coin["symbol"], ConsumedLedgerItem[]>
}

export function toComputedLedger(ledger: Ledger): ComputedLedger {
  let computed: ComputedLedger = { ledger: [], consumed: {}, left: {} }

  for (const item of sortLedger(ledger)) {
    computed = compute(computed, item)
  }

  return computed
}

const compute = (
  { ledger, consumed, left }: ComputedLedger,
  ledgerItem: LedgerItem
): ComputedLedger => {
  const currFrom = left[ledgerItem.from.symbol] ?? []
  const currTo = left[ledgerItem.to.symbol] ?? []

  let remaining = ledgerItem.from.amount
  let purchaseSumEur = 0
  const newFrom: typeof currFrom = []
  const taxGains: TaxInfo[] = []
  const knownToUnitPrice = calculateToUnitPrice(ledgerItem, 0)
  const itemsConsumed: ComputedLedgerItem[] = []
  for (const item of currFrom) {
    if (remaining >= item.amount) {
      remaining -= item.amount
      purchaseSumEur += item.amount * item.unitPriceEur

      if (ledgerItem.from.symbol !== "EUR" && knownToUnitPrice) {
        const taxInfo: TaxInfo = {
          fromEur: item.amount * item.unitPriceEur,
          toEur:
            (item.amount / ledgerItem.from.amount) *
            ledgerItem.to.amount *
            knownToUnitPrice,
          fromDate: item.purchaseDate,
          toDate: ledgerItem.date,
        }
        taxGains.push(taxInfo)
        itemsConsumed.push({ ...item.item, taxableGain: calculateTax(taxInfo) })
      }
    } else {
      newFrom.push({ ...item, amount: item.amount - remaining })
      purchaseSumEur += remaining * item.unitPriceEur
      if (
        ledgerItem.from.symbol !== "EUR" &&
        knownToUnitPrice &&
        remaining > 0
      ) {
        const taxInfo: TaxInfo = {
          fromEur: remaining * item.unitPriceEur,
          toEur:
            (remaining / ledgerItem.from.amount) *
            ledgerItem.to.amount *
            knownToUnitPrice,
          fromDate: item.purchaseDate,
          toDate: ledgerItem.date,
        }
        itemsConsumed.push({ ...item.item, taxableGain: calculateTax(taxInfo) })
        taxGains.push(taxInfo)
      }
      remaining = 0
    }
  }

  if (remaining) {
    newFrom.push({
      amount: -remaining,
      purchaseDate: ledgerItem.date,
      unitPriceEur: ledgerItem.from.unitPriceEur!,
      item: ledgerItem,
    })
  }

  const toUnitPriceEur = calculateToUnitPrice(ledgerItem, purchaseSumEur)

  const taxableGain = taxGains.reduce(
    (sum, taxInfo) => sum + calculateTax(taxInfo),
    0
  )

  const leftFrom =
    ledgerItem.from.symbol === "EUR"
      ? {}
      : { [ledgerItem.from.symbol]: newFrom }

  const leftTo =
    ledgerItem.to.symbol === "EUR"
      ? {}
      : {
          [ledgerItem.to.symbol]: [
            ...currTo,
            {
              amount: ledgerItem.to.amount,
              item: ledgerItem,
              purchaseDate: ledgerItem.date,
              unitPriceEur: toUnitPriceEur,
            },
          ],
        }

  return {
    consumed: { ...consumed, [ledgerItem.id]: itemsConsumed },
    ledger: [...ledger, { ...ledgerItem, taxableGain }],
    left: {
      ...left,
      ...leftFrom,
      ...leftTo,
    },
  }
}

const calculateToUnitPrice = (item: LedgerItem, purchaseSumEur: number) => {
  if (item.to.unitPriceEur !== undefined) return item.to.unitPriceEur
  if (item.from.unitPriceEur !== undefined)
    return (item.from.unitPriceEur * item.from.amount) / item.to.amount
  return purchaseSumEur / item.to.amount
}
