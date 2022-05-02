import { calculateTax, Coin, Ledger, LedgerItem, sortLedger, TaxInfo } from "."

// TODO: Calculations should be only done with proper Decimals instead of floating points.
// Most coins use up to 8 decimals of precision.
const ZERO_WITH_WIGGLE_SPACE = 1e-9

export type ComputedLedgerItem = LedgerItem & {
  taxableGain: number
}

type ConsumedLedgerItem = {
  amount: number
  purchaseTimestamp: number
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
  const ledgerItemFeeAmountEur =
    (ledgerItem.fee?.unitPriceEur ?? 0) * (ledgerItem.fee?.amount ?? 0)

  for (const item of currFrom) {
    const itemFeeAmountEur =
      (item.item.fee?.unitPriceEur ?? 0) * (item.item.fee?.amount ?? 0)
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
          fromTimestamp: item.purchaseTimestamp,
          toTimestamp: ledgerItem.timestamp,
          fromFeesEur: itemFeeAmountEur,
          toFeesEur:
            ledgerItemFeeAmountEur * (item.amount / ledgerItem.from.amount),
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
          fromTimestamp: item.purchaseTimestamp,
          toTimestamp: ledgerItem.timestamp,
          fromFeesEur: itemFeeAmountEur * (remaining / item.amount),
          toFeesEur:
            ledgerItemFeeAmountEur * (remaining / ledgerItem.from.amount),
        }
        itemsConsumed.push({
          timestamp: item.item.timestamp,
          id: item.item.id,
          from: {
            ...item.item.from,
            amount: item.item.from.amount * (remaining / item.item.to.amount),
          },
          to: {
            ...item.item.to,
            amount: remaining,
          },
          fee: item.item.fee
            ? {
                ...item.item.fee,
                amount:
                  item.item.fee.amount * (remaining / item.item.to.amount),
              }
            : undefined,
          taxableGain: calculateTax(taxInfo),
        })
        taxGains.push(taxInfo)
      }
      remaining = 0
    }
  }

  if (remaining > ZERO_WITH_WIGGLE_SPACE && ledgerItem.from.symbol !== "EUR") {
    const timeFormatted = new Date(ledgerItem.timestamp).toLocaleString("fi-FI")
    throw new Error(
      `Lisääthän transaktiot aikajärjestykessä vanhimmasta uusimpaan!\n\n` +
        `Yritit vähentää ${ledgerItem.from.amount} ${ledgerItem.from.symbol} aikaleimalla ${timeFormatted}, ` +
        `mutta tilillä ei laskujeni mukaan ole tarpeeksi valuuttaa, vaan siellä on ainoastaan ` +
        `${ledgerItem.from.amount - remaining} ${ledgerItem.from.symbol}. ` +
        `Tämä luultavasti johtuu siitä, että olet ostanut kyseistä valuuttaa aiemmin, mutta se puuttuu vielä järjestelmästä. ` +
        `Kryptovero.fi olettaa, että transaktiot syötetään aina siinä järjestyksessä kun ne ovat tapahtuneet, vanhimmasta uusimpaan.`
    )
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
              purchaseTimestamp: ledgerItem.timestamp,
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
