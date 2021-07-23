import s from "../styles/ImporterDescription.module.scss";
import OnlyCoinbaseSupported from "./OnlyCoinbaseSupported";

export default function ImporterDescription() {
  return (
    <>
      <ol>
        <li>
          Avaa{" "}
          <a
            href="https://pro.coinbase.com/profile/statements"
            target="_blank"
            rel="noreferrer"
          >
            Coinbase Pro:n raportit -sivu
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
      <OnlyCoinbaseSupported />
    </>
  );
}
