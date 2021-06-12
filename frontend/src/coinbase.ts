import { Temporal } from "proposal-temporal";

export const getPriceAt = async (date: Temporal.PlainDate, symbol: string) => {
  const [[time, low, high, open, close, volume]] = await fetch(
    `https://api.pro.coinbase.com/products/${symbol}-EUR/candles?start=${date.toString(
      { calendarName: "never" }
    )}Z00:00:00.00&end=${date
      .add(Temporal.Duration.from({ days: 1 }))
      .toString({
        calendarName: "never",
      })}Z00:00:00.00&granularity=86400`
  ).then((res) => res.json());
  return (open + close) / 2;
};
