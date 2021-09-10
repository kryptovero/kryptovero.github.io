import Link from "next/link";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Importer from "../components/Importer";
import ImporterDescription from "../components/ImporterDescription";
import { insertEvent, useAppDispatch } from "../components/store";
import s from "../styles/Onboarding.module.scss";

export default function Onboarding() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return (
    <>
      <Header additionalTitle="Tervetuloa" />
      <main className={s.centeredContainer}>
        <h1>Tervetuloa</h1>
        <Importer
          accept="text/csv"
          onRead={async (file) => {
            dispatch(
              insertEvent({
                type: "importCoinbaseCsv",
                data: await file.text(),
              })
            );
            router.push("/app");
          }}
        >
          Aloitetaan hakemalla Coinbase Pro:sta<em>*</em> tekemäsi kaupat
          <ImporterDescription />
        </Importer>
        <Link href="/app">
          <a className="btn btn--secondary">
            En käytä Coinbase Pro:ta tai
            <br />
            haluan syöttää datan käsin
          </a>
        </Link>
      </main>
    </>
  );
}
