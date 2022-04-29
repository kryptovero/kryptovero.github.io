import { ExecutionContext } from "ava"

export const eq = <T>(t: ExecutionContext<unknown>, left: T, right: T) =>
  t.deepEqual(
    JSON.parse(JSON.stringify(left)),
    JSON.parse(JSON.stringify(right))
  )

export const utcDate = (date: string) => Date.parse(date)
