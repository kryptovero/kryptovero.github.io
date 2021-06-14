import "./App.css";
import LedgerTable from "./LedgerTable";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import NewEntryForm from "./NewEntryForm";
import { reducer, usePersistedReducer } from "./reducer";
import Importer from "./Importer";
import { useSymbols } from "./useSymbols";

const App = () => {
  const [ledger, dispatch] = usePersistedReducer(reducer, []);
  const symbols = useSymbols(ledger);

  return (
    <main>
      <Router>
        <Switch>
          <Route path="/new">
            <NewEntryForm dispatch={dispatch} symbols={symbols} />
          </Route>
          <Route path="/import">
            <Importer dispatch={dispatch} />
          </Route>
          <Route path="/">
            <LedgerTable
              ledger={ledger}
              dispatch={dispatch}
              symbols={symbols}
            />
          </Route>
        </Switch>
      </Router>
    </main>
  );
};

export default App;
