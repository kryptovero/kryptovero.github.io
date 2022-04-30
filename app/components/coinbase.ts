import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import addDays from "date-fns/addDays";

const toISOString = (timestamp: number | Date) =>
  new Date(timestamp).toISOString();

export const getPriceAt = async (
  timestamp: number,
  symbol: string
): Promise<number> => {
  const result = await fetch(
    `https://api.pro.coinbase.com/products/${symbol}-EUR/candles?start=${toISOString(
      timestamp
    )}&end=${toISOString(addDays(timestamp, 1))}&granularity=86400`
  ).then((res) => res.json());
  const first = result?.[0];
  if (!first) throw new Error("No result");
  const open = first[3];
  const close = first[4];
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
