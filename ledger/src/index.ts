import { Temporal } from "proposal-temporal"
import { step } from "./step"

type Coin = { unitPriceEur?: number; symbol: string; amount: number }

export type LedgerItem = {
  date: Temporal.PlainDate
  from: Coin
  to: Coin
  fee?: Coin
  id: string
}

export type Ledger = LedgerItem[]

export type TaxInfo = {
  fromEur: number
  toEur: number
  fromDate: Temporal.PlainDate
  toDate: Temporal.PlainDate
}

type LedgerSnapshotItem = {
  amount: number
  purchaseDate: Temporal.PlainDate
  unitPriceEur: number
}
export type LedgerSnapshot = { [symbol: string]: LedgerSnapshotItem[] }

const calculateTax = (taxInfo: TaxInfo) => {
  /**
   * The calculation that involves the “deemed acquisition cost” subtracts
   * 20% of the selling price if the holding time of the assets was less than 10 years,
   * and 40% if the holding time was at least 10 years.
   */
  const heldMoreThan10Years =
    taxInfo.fromDate
      .add(Temporal.Duration.from({ years: 10 }))
      .until(taxInfo.toDate).days >= 0
  const deemedAcquisitionCost = heldMoreThan10Years ? 0.4 : 0.2

  /**
   * The calculation is performed in such a way that the result is beneficial for the taxpayer:
   * Either the actual acquisition cost (plus selling expenses) is subtracted,
   * or a “deemed acquisition cost” is subtracted
   * (the latter alternative does not allow any selling expenses to be included).
   */
  return Math.min(
    taxInfo.toEur * (1 - deemedAcquisitionCost),
    taxInfo.toEur - taxInfo.fromEur
  )
}

export const calculateGains = (
  from: Temporal.PlainDate,
  to: Temporal.PlainDate,
  ledger: Ledger
) => {
  let snapshot: LedgerSnapshot = {}
  const sorted = sortLedger(ledger)
  const untilFrom = sorted.filter(({ date }) => date.until(from).days >= 0)
  const untilTo = sorted.filter(
    ({ date }) => date.until(from).days < 0 && date.until(to).days >= 0
  )

  for (const item of untilFrom) {
    snapshot = step(snapshot, item).snapshot
  }

  let gains = 0
  for (const item of untilTo) {
    const result = step(snapshot, item)
    snapshot = result.snapshot
    gains += result.taxGains.reduce(
      (sum, taxInfo) => sum + calculateTax(taxInfo),
      0
    )
  }

  return gains
}

export const stateAt = (
  date: Temporal.PlainDate,
  ledger: Ledger
): LedgerSnapshot => {
  let snapshot: LedgerSnapshot = {}
  const sorted = sortLedger(ledger)
  const untilDate = sorted.filter((item) => item.date.until(date).days >= 0)

  for (const item of untilDate) {
    snapshot = step(snapshot, item).snapshot
  }

  return snapshot
}

export const sortLedger = (ledger: Ledger) =>
  [...ledger].sort((a, b) => a.date.since(b.date).days)
