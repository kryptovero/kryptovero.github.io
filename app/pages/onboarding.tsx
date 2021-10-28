import Link from "next/link";
import classNames from "classnames";
import { useRouter } from "next/router";
import { useState } from "react";
import Header from "../components/Header";
import Importer from "../components/Importer";
import ImporterDescription from "../components/ImporterDescription";
import { insertEvent, useAppDispatch } from "../components/store";
import s from "../styles/Onboarding.module.scss";

export default function Onboarding() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [importLocation, setImportLocation] = useState<
    "" | "coinbase" | "coinbasePro"
  >("");

  return (
    <>
      <Header additionalTitle="Tervetuloa" />
      <main className={s.centeredContainer}>
        <h1>Tervetuloa</h1>
        <div className={s.importLocationContainer}>
          <h2>
            Valitse ensin kauppapaikka, josta haluat hakea tekemäsi kaupat
          </h2>
          <div className={s.importLocationList}>
            <div
              onClick={(e) => {
                setImportLocation("coinbase");
              }}
              className={classNames(s.importLocation, {
                [s.disabledLocation]:
                  importLocation !== "" && importLocation !== "coinbase",
              })}
            >
              <img src="/coinbase.svg" alt="Coinbase" width={200} />
            </div>
            <div
              onClick={(e) => {
                setImportLocation("coinbasePro");
              }}
              className={classNames(s.importLocation, {
                [s.disabledLocation]:
                  importLocation !== "" && importLocation !== "coinbasePro",
              })}
            >
              <img src="/coinbase.svg" alt="Coinbase" width={200} />
              <strong>&nbsp;&nbsp;Pro</strong>
            </div>
          </div>
        </div>
        {importLocation !== "" && (
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
            Aloitetaan hakemalla Coinbase Pro:sta<em>*</em> tekemäsi kaupat
            <ImporterDescription />
          </Importer>
        )}
        <Link href="/app">
          <a className="btn btn--secondary">
            En käytä Coinbase:a, Coinbase Pro:ta tai
            <br />
            haluan syöttää datan käsin
          </a>
        </Link>
      </main>
    </>
  );
}
