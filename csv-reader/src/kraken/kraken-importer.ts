import { Temporal } from "proposal-temporal"
import { Ledger, LedgerItem } from "@fifo/ledger"
import { KrakenCryptos, KrakenFiats } from "./types"

export default function readKrakenCsv(input: string): Ledger {
  return input
    .split("\n")
    .slice(1)
    .filter((row) => row.trim())
    .map(parseRow)
    .map(parseKrakenToLedgerItem)
}

type KrakenLedgerItemType = "buy" | "sell"
// Kraken pairs
type KrakenFiat = `Z${KrakenFiats}`
type KrakenPair =
  | `${KrakenCryptos}${KrakenFiat}`
  | `${KrakenFiat}${KrakenCryptos}`

const pair: KrakenPair = "XETH"
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
const parseKrakenToLedgerItem = (item: KrakenLedgerItem): LedgerItem => {
  //TODO: Find & parse Kraken pair from string
}
