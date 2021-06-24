import Image from "next/image";
import Header from "../components/Header";
import heroImage from "../public/hero.svg";
import illustrationImage1 from "../public/illustrationImage1.svg";
import illustrationImage2 from "../public/illustrationImage2.svg";
import styles from "../styles/Home.module.scss";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header
        buttons={
          <>
            <Link href="/start">
              <a className="btn">Aloita käyttö</a>
            </Link>
            <a href="https://github.com/jehna/fifo-fi/graphs/contributors">
              Tekjät
            </a>
            <a href="https://github.com/jehna/fifo-fi/">Lähdekoodi</a>
          </>
        }
      />
      <main>
        <div className={`${styles.indexWrapper} ${styles.row}`}>
          <div className={styles.hero}>
            <h1 className={styles.h1}>
              Laske verot myymistäsi kryptovaluutoista
            </h1>
            <p>
              Ilmaisella työkalulla lasket automaattisesti verotettavan voiton
              määrän kaikista myynneistäsi ja ostoistasi Suomen verottajan
              ohjeiden mukaan
            </p>

            <Link href="/start">
              <a className="btn">Aloita käyttö</a>
            </Link>
          </div>
          <Image src={heroImage} alt="" layout="fixed" />
        </div>
        <div className={`${styles.row} ${styles.secondRowWrapper}`}>
          <Image src={illustrationImage1} alt="" layout="fixed" />
          <div>
            <h2 className={styles.h1}>Näin se toimii</h2>
            <ol>
              <li>
                Hae tekemiesi ostosten data pörssistä<em>*</em>
                <div className={styles.info}>
                  Osto- ja myyntidatan lataus on parin klikin päässä
                </div>
              </li>
              <li>
                Lataa ostosten data kryptoveo.fi -työkaluun
                <div className={styles.info}>
                  Voit myös lisätä tekemäsi ostokset käsin
                </div>
              </li>
              <li>
                Valmis!
                <div className={styles.info}>
                  Saat heti oikeat luvut veroilmoitukseen
                </div>
              </li>
            </ol>
            <small>
              <em>*</em> Vain coinbase.com tuettu tällä hektellä. Muiden
              pörssien data tulee syöttää käsin.
            </small>
          </div>
        </div>
        <div className={`${styles.row} ${styles.thirdRowWrapper}`}>
          <div>
            <h2 className={styles.h1}>Avoin, ilmainen ja turvallinen</h2>
            <p>
              Tämä projekti on tehty harrastustoiminnan pohjalta ja sen
              lähdekoodi on avointa. Tämä tarkoittaa, että uusia ominaisuuksia
              voi kehittää kuka tahansa ja saada ne helposti lisättyä tähän
              palveluun.
            </p>

            <p>
              Jos löydät palvelusta virheen, voit ilmoittaa siitä avaamalla{" "}
              <a href="https://github.com/jehna/fifo-fi/issues">
                Github issuen
              </a>
              . Löydät lähdekoodin ja lisää tietoa{" "}
              <a href="https://github.com/jehna/fifo-fi">
                Projektin Github-sivulta
              </a>
              .
            </p>

            <p>
              Tämä sivusto on suunniteltu siten, että kaikki laskenta tapahtuu
              sinun koneellasi. Ostodata pysyy vain sinun laitteellasi.
            </p>
          </div>
          <Image src={illustrationImage2} alt="" layout="fixed" />
        </div>
      </main>
    </>
  );
}
