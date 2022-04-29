import Header from "../components/Header";
import Importer from "../components/Importer";
import s from "../styles/Load.module.scss";
import os from "../styles/Onboarding.module.scss";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { AppStateItem } from "../components/app-state";
import { insertEvent } from "../components/store";
import { SaveData } from "../components/use-save";

export default function CoinbaseImport() {
  const dispatch = useDispatch();
  const router = useRouter();

  return (
    <>
      <Header additionalTitle="Jatka siitä mihin jäätiin..."></Header>
      <main className={`${os.centeredContainer} ${s.container}`}>
        <h1>Tervetuloa takaisin!</h1>
        <Importer
          accept="application/kryptovero.fi"
          onRead={async (file) => {
            // Todo: Handle autosave
            // Todo: Use parser like io-ts
            const { items } = JSON.parse(await file.text()) as SaveData;
            items.forEach((item) => dispatch(insertEvent(item)));
            router.push("/app");
          }}
        >
          <img src="/load.svg" alt="" />
          <p>
            Tiputa <em>.vero</em> -tiedosto tähän tai paina valitaksesi tiedosto{" "}
          </p>
        </Importer>
        <Link href="/start">
          <a className="btn btn--secondary">Takaisin</a>
        </Link>
      </main>
    </>
  );
}
