import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Header.module.scss";

export default function Header({
  buttons,
  additionalTitle,
  description,
}: {
  buttons?: JSX.Element;
  additionalTitle?: string;
  description?: string;
}) {
  return (
    <>
      <Head>
        <title>
          kryptovero.fi{additionalTitle ? " | ".concat(additionalTitle) : ""}
        </title>
        {description && <meta name="description" content={description} />}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className={styles.header}>
        <Link href="/">
          <a className={styles.logo}>kryptovero.fi</a>
        </Link>
        <div className={styles.buttons}>{buttons}</div>
      </header>
    </>
  );
}
