import { Temporal } from "proposal-temporal"
import { Ledger, LedgerItem } from "@fifo/ledger"
import {
  KrakenCryptos,
  KrakenCryptosArr,
  KrakenFiats,
  KrakenFiatsArr,
} from "./types"

export default function readKrakenCsv(input: string): Ledger {
  const ledger = input
    .split("\n")
    .slice(1)
    .filter((row) => row.trim())
    .map(parseRow)
    .map(parseKrakenToLedgerItem)
  console.log(ledger)
  return ledger
}

type KrakenLedgerItemType = "buy" | "sell"
// Kraken pairs
type KrakenFiat = `Z${KrakenFiats}`
type KrakenPair =
  | `${KrakenCryptos}${KrakenFiat}`
  | `${KrakenFiat}${KrakenCryptos}`

interface KrakenLedgerItem {
  txId: string
  orderTxId: string
  pair: KrakenPair
  time: Temporal.PlainDate
  type: KrakenLedgerItemType
  orderType: string
  price: number
  cost: number
  fee: number
  volume: number
}
//"txid","ordertxid","pair","time","type","ordertype","price","cost","fee","vol","margin","misc","ledgers"
const parseRow = (strRow: string) => {
  const [
    txId,
    orderTxId,
    pair,
    time,
    type,
    orderType,
    price,
    cost,
    fee,
    volume,
    margin,
    misc,
    ledgers,
  ] = strRow.replace(/["]+/g, "").split(",")
  return {
    txId,
    orderTxId,
    pair: pair as KrakenPair,
    time: Temporal.PlainDate.from(time),
    type: type as KrakenLedgerItemType,
    orderType,
    price: parseFloat(price),
    cost: parseFloat(cost),
    fee: parseFloat(fee),
    volume: parseFloat(volume),
    margin: parseFloat(margin),
    misc,
    ledgers,
  } as KrakenLedgerItem
}

// Still working on it
//@ts-ignore
export const parseKrakenToLedgerItem = (item: KrakenLedgerItem): LedgerItem => {
  console.log("TIME: ", item.time)
  //TODO: Find & parse Kraken pair from string
  const combined = [...KrakenCryptosArr, ...KrakenFiatsArr]
  const left = combined.find((e) => item.pair.startsWith(e))
  const right = combined.find((e) => item.pair.endsWith(e))

  // Determine asset type for pair sides
  const from = {
    symbol: left as string,
    // If the from asset is fiat, use cost.
    amount: KrakenFiatsArr.includes(left as KrakenFiats)
      ? item.cost
      : item.volume,
    unitPriceEur: KrakenFiatsArr.includes(left as KrakenFiats)
      ? undefined
      : item.cost,
  }
  const to = {
    symbol: right as string,
    amount: KrakenFiatsArr.includes(right as KrakenFiats)
      ? item.cost
      : item.volume,
    unitPriceEur: KrakenFiatsArr.includes(right as KrakenFiats)
      ? undefined
      : item.cost,
  }
  // Inefficient permutation search
  return {
    from,
    to,
    date: item.time,
    id: item.txId,
  }
}
