import Link from "next/link";
import Header from "../components/Header";
import Importer from "../components/Importer";
import ImporterDescription from "../components/ImporterDescription";
import s from "../styles/Onboarding.module.scss";

export default function Onboarding() {
  return (
    <>
      <Header additionalTitle="Tervetuloa" />
      <main className={s.centeredContainer}>
        <h1>Tervetuloa</h1>
        <Importer>
          Aloitetaan hakemalla Coinbasesta<em>*</em> tekemäsi kaupat
          <ImporterDescription />
        </Importer>
        <Link href="/app">
          <a className="btn btn--secondary">
            En käytä Coinbasea tai
            <br />
            haluan syöttää datan käsin
          </a>
        </Link>
      </main>
    </>
  );
}
