import Header from "../components/Header";
import Importer from "../components/Importer";
import ImporterDescription from "../components/ImporterDescription";
import s from "../styles/CoinbaseImport.module.scss";
import os from "../styles/Onboarding.module.scss";
import Link from "next/link";
import { useRouter } from "next/router";
import { insertEvent, useAppDispatch } from "../components/store";

export default function CoinbaseImport() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return (
    <>
      <Header additionalTitle="Tuo Coinbase Pro:sta..."></Header>
      <main className={os.centeredContainer}>
        <h1>Tuo Coinbase Pro:sta...</h1>
        <Importer
          accept="text/csv"
          onRead={async (file) => {
            dispatch(
              insertEvent({
                type: "importCoinbaseCsv",
                data: await file.text(),
                prefilledEurValues: {},
              })
            );
            router.push("/app");
          }}
        >
          Hae Coinbase Pro:sta<em>*</em> tekemäsi kaupat
          <ImporterDescription />
        </Importer>
        <Link href="/app">
          <a className="btn btn--secondary">Takaisin</a>
        </Link>
      </main>
    </>
  );
}
