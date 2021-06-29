import Header from "../components/Header";
import Importer from "../components/Importer";
import s from "../styles/Load.module.scss";
import os from "../styles/Onboarding.module.scss";
import Link from "next/link";

export default function CoinbaseImport() {
  return (
    <>
      <Header additionalTitle="Import from Coinbase"></Header>
      <main className={`${os.centeredContainer} ${s.container}`}>
        <h1>Tervetuloa takaisin!</h1>
        <Importer accept="application/kryptovero.fi">
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
