import Header from "../components/Header";
import { useSave } from "../components/use-save";
import s from "../styles/App.module.scss";

export default function App() {
  const [onSave] = useSave();
  return (
    <>
      <Header
        buttons={
          <button className="btn" onClick={() => onSave({ foo: "bar" })}>
            Tallenna
          </button>
        }
      />
      <main className={s.app}>
        <div className={s.container}>
          <h1 className={s.box}> Hello world!</h1>
        </div>
      </main>
    </>
  );
}
