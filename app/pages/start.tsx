import Link from "next/link";
import Header from "../components/Header";
import s from "../styles/Start.module.scss";

export default function Start() {
  return (
    <>
      <Header additionalTitle="Aloita käyttö" />
      <main className={s.centeredContainer}>
        <img src="/start-illustration.svg" alt="" />
        <Link href="/onboarding">
          <a className="btn">Olen ensikertalainen</a>
        </Link>
        <Link href="/load-file">
          <a className="btn btn--secondary">Jatka siitä mihin jäin</a>
        </Link>
      </main>
    </>
  );
}
