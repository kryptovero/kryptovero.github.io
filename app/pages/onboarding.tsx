import Link from "next/link";
import Header from "../components/Header";
import Importer from "../components/Importer";
import s from "../styles/Onboarding.module.scss";

export default function Onboarding() {
  return (
    <>
      <Header additionalTitle="Tervetuloa" />
      <main className={s.centeredContainer}>
        <h1>Tervetuloa</h1>
        <Importer>
          Aloitetaan hakemalla Coinbasesta<em>*</em> tekemäsi kaupat
          <ol>
            <li>
              Avaa{" "}
              <a
                href="https://pro.coinbase.com/profile/statements"
                target="_blank"
                rel="noreferrer"
              >
                Coinbasen raportit -sivu
              </a>
              <div className={s.info}>
                Tämä sivu listaa kaikki tekemäsi raportit
              </div>
            </li>
            <li>
              Generoi Fills -raportti CSV-muodossa
              <div className={s.info}>
                Lataa kaikki data, myös aiemmilta vuosilta
              </div>
            </li>
            <li>
              Tiputa raportti tähän tai klikkaa valitaksesi tiedoston
              <div className={s.info}>
                Tiedosto luetaan ja prosessoidaan vain selaimessa
              </div>
            </li>
          </ol>
          <small>
            <em>*</em> Vain coinbase.com tuettu tällä hektellä. Muiden pörssien
            data tulee syöttää käsin.
          </small>
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
