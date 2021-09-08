import { Temporal } from "proposal-temporal";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const getPriceAt = async (date: Temporal.PlainDate, symbol: string) => {
  const result = await fetch(
    `https://api.pro.coinbase.com/products/${symbol}-EUR/candles?start=${date.toString(
      { calendarName: "never" }
    )}Z00:00:00.00&end=${date
      .add(Temporal.Duration.from({ days: 1 }))
      .toString({
        calendarName: "never",
      })}Z00:00:00.00&granularity=86400`
  ).then((res) => res.json());
  const open = result?.[0]?.[3] ?? 1;
  const close = result?.[0]?.[4] ?? 1;
  return (open + close) / 2;
};

type ProductResponse = { quote_currency: string; base_currency: string }[];
export const coinbaseApi = createApi({
  reducerPath: "coinsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.pro.coinbase.com/",
  }),
  endpoints: (builder) => ({
    coinSymbols: builder.query({
      query: () => "products",
      transformResponse: (response: ProductResponse) =>
        Array.from(
          new Set(
            response
              .flatMap(({ base_currency, quote_currency }) => [
                base_currency,
                quote_currency,
              ])
              .sort()
          )
        ),
    }),
  }),
});
export const { useCoinSymbolsQuery } = coinbaseApi;
