import { useEffect, useState } from "react";
import { Ledger } from "../../ledger/build";
import { getCoins } from "./coinbase";

export function useSymbols(ledger: Ledger) {
  const [symbols, setSymbols] = useState([
    ...new Set(ledger.flatMap((v) => [v.from.symbol, v.to.symbol])),
  ]);
  useEffect(() => {
    const cached = localStorage.getItem("symbols");
    if (cached) setSymbols(JSON.parse(cached));
    else
      getCoins().then((symbols) => {
        setSymbols(symbols);
        localStorage.setItem("symbols", JSON.stringify(symbols));
      });
  }, []);

  return symbols;
}
