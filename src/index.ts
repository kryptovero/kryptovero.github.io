import { Temporal } from "proposal-temporal"
import { step } from "./step"

type Coin = { unitPriceEur?: number; symbol: string; amount: number }

export type LedgerItem = {
  date: Temporal.PlainDate
  from: Coin
  to: Coin
}

export type Ledger = LedgerItem[]

type LedgerSnapshotItem = {
  amount: number
  purchaseDate: Temporal.PlainDate
  unitPriceEur: number
}
export type LedgerSnapshot = { [symbol: string]: LedgerSnapshotItem[] }

const snapshotValueEur = (snapshot: LedgerSnapshot) => {
  return Object.values(snapshot).reduce(
    (sum, items) =>
      sum +
      items.reduce((sum, item) => sum + item.unitPriceEur * item.amount, 0),
    0
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
    snapshot = step(snapshot, item)
  }

  const valueInFrom = snapshotValueEur(snapshot)
  for (const item of untilTo) {
    snapshot = step(snapshot, item)
  }

  return snapshotValueEur(snapshot) - valueInFrom
}

export const stateAt = (
  date: Temporal.PlainDate,
  ledger: Ledger
): LedgerSnapshot => {
  let snapshot: LedgerSnapshot = {}
  const sorted = sortLedger(ledger)
  const untilDate = sorted.filter((item) => item.date.until(date).days >= 0)

  for (const item of untilDate) {
    snapshot = step(snapshot, item)
  }

  return snapshot
}

const sortLedger = (ledger: Ledger) =>
  [...ledger].sort((a, b) => a.date.since(b.date).days)
