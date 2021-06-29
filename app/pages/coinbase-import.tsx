import Header from "../components/Header";
import Importer from "../components/Importer";
import ImporterDescription from "../components/ImporterDescription";
import s from "../styles/CoinbaseImport.module.scss";
import os from "../styles/Onboarding.module.scss";
import Link from "next/link";

export default function CoinbaseImport() {
  return (
    <>
      <Header additionalTitle="Import from Coinbase"></Header>
      <main className={os.centeredContainer}>
        <h1>Tuo Coinbasesta...</h1>
        <Importer>
          Hae Coinbasesta<em>*</em> tekemäsi kaupat
          <ImporterDescription />
        </Importer>
        <Link href="/app">
          <a className="btn btn--secondary">Takaisin</a>
        </Link>
      </main>
    </>
  );
}
