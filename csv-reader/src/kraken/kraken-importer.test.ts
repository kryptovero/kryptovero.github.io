import test from "ava"
import readKrakenCsv from "./kraken-importer"

const data = `"txid","ordertxid","pair","time","type","ordertype","price","cost","fee","vol","margin","misc","ledgers"
"ANONYMIZED","ANONYMIZED","XETHZEUR","2021-07-23 11:22:54.9881","buy","limit",1648.83000,1648.83000,4.28696,1.00000000,0.00000,"","ANONYMIZED, ANONYMIZED"
`

const KRAKEN_HEADER = `txid","ordertxid","pair","time","type","ordertype","price","cost","fee","vol","margin","misc","ledgers"`
test("Works", (t) => {
  t.pass()
})

import { ExecutionContext } from "ava"

export const eq = <T>(t: ExecutionContext<unknown>, left: T, right: T) =>
  t.deepEqual(
    JSON.parse(JSON.stringify(left)),
    JSON.parse(JSON.stringify(right))
  )
