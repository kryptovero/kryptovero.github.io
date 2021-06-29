import Link from "next/link";
import { useRouter } from "next/router";
import { useAppState } from "../components/app-state";
import Header from "../components/Header";
import Importer from "../components/Importer";
import ImporterDescription from "../components/ImporterDescription";
import s from "../styles/Onboarding.module.scss";

export default function Onboarding() {
  const addAppStateItem = useAppState();
  const router = useRouter();

  return (
    <>
      <Header additionalTitle="Tervetuloa" />
      <main className={s.centeredContainer}>
        <h1>Tervetuloa</h1>
        <Importer
          accept="text/csv"
          onRead={async (file) => {
            addAppStateItem({
              type: "importCoinbaseCsv",
              data: await file.text(),
            });
            router.push("/app");
          }}
        >
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
