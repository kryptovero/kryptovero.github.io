import { Temporal } from "proposal-temporal";
import Header from "../components/Header";
import Importer from "../components/Importer";
import s from "../styles/Load.module.scss";
import os from "../styles/Onboarding.module.scss";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { appStateAtom } from "../components/app-state";

export default function CoinbaseImport() {
  const [_appState, setAppState] = useAtom(appStateAtom);
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
            setAppState(JSON.parse(await file.text(), reviveDates));
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

const reviveDates = (_, value: any) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return Temporal.PlainDate.from(value);
  return value;
};
