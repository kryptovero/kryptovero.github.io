import s from "../styles/ImporterDescription.module.scss";

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
        <em>*</em> Vain coinbase.com tuettu tällä hektellä. Muiden pörssien data
        tulee syöttää käsin.
      </small>
    </>
  );
}
