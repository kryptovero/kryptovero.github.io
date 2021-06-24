import styles from "../styles/Header.module.scss";

export default function Header({ buttons }: { buttons?: JSX.Element }) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.logo}>kryptovero.fi</div>
        <div className={styles.buttons}>{buttons}</div>
      </header>
    </>
  );
}
