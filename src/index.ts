import { Temporal } from "proposal-temporal"
import { step } from "./step"

type Coin = { unitPriceEur?: number; symbol: string; amount: number }

export type LedgerItem = {
  date: Temporal.PlainDate
  from: Coin
  to: Coin
  fee?: Coin
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
   * "Hankintameno-olettamaa käytettäessä vähennys on 20 % luovutushinnasta,
   * jos omaisuus on omistettu alle 10 vuotta ja 40 %, jos omaisuus on omistettu
   * vähintään 10 vuotta"
   */
  const heldMoreThan10Years =
    taxInfo.fromDate
      .add(Temporal.Duration.from({ years: 10 }))
      .until(taxInfo.toDate).days >= 0
  const acquisitionCostAssumption = heldMoreThan10Years ? 0.4 : 0.2

  /**
   * realisoitunut arvonnousu .. lasketaan verovelvolliselle edullisemmalla tavalla:
   * .. luovutushinnasta voidaan vähentää joko todellinen hankintahinta kuluineen tai
   * .. hankintameno-olettama ilman mitään muita kuluja
   */
  return Math.min(
    taxInfo.toEur * (1 - acquisitionCostAssumption),
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

const sortLedger = (ledger: Ledger) =>
  [...ledger].sort((a, b) => a.date.since(b.date).days)
