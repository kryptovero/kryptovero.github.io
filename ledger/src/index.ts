import addYears from "date-fns/addYears"
import { toComputedLedger } from "./to-computed-ledger"
export {
  toComputedLedger,
  ComputedLedger,
  ComputedLedgerItem,
} from "./to-computed-ledger"

export type Coin = { unitPriceEur?: number; symbol: string; amount: number }

export type LedgerItem = {
  timestamp: number
  from: Coin
  to: Coin
  fee?: Coin
  id: string
}

export type Ledger = LedgerItem[]

export type TaxInfo = {
  fromEur: number
  toEur: number
  fromTimestamp: number
  toTimestamp: number
  fromFeesEur: number
  toFeesEur: number
}

type LedgerSnapshotItem = {
  amount: number
  purchaseTimestamp: number
  unitPriceEur: number
}
export type LedgerSnapshot = { [symbol: string]: LedgerSnapshotItem[] }

export const calculateTax = (taxInfo: TaxInfo) => {
  /**
   * The calculation that involves the “deemed acquisition cost” subtracts
   * 20% of the selling price if the holding time of the assets was less than 10 years,
   * and 40% if the holding time was at least 10 years.
   */
  const heldMoreThan10Years =
    addYears(taxInfo.fromTimestamp, 10).getTime() < taxInfo.toTimestamp
  const deemedAcquisitionCost = heldMoreThan10Years ? 0.4 : 0.2

  /**
   * The calculation is performed in such a way that the result is beneficial for the taxpayer:
   * Either the actual acquisition cost (plus selling expenses) is subtracted,
   * or a “deemed acquisition cost” is subtracted
   * (the latter alternative does not allow any selling expenses to be included).
   */
  return Math.min(
    taxInfo.toEur * (1 - deemedAcquisitionCost),
    taxInfo.toEur - taxInfo.fromEur - taxInfo.fromFeesEur - taxInfo.toFeesEur
  )
}

export const calculateGains = (from: number, to: number, ledger: Ledger) => {
  const computed = toComputedLedger(ledger)
  const untilTo = computed.ledger.filter(
    ({ timestamp }) => timestamp > from && timestamp <= to
  )
  return untilTo.reduce((sum, { taxableGain }) => sum + taxableGain, 0)
}

export const sortLedger = (ledger: Ledger) =>
  [...ledger].sort((a, b) => a.timestamp - b.timestamp)
