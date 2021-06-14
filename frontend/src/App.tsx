import "./App.css";
import LedgerTable from "./LedgerTable";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import NewEntryForm from "./NewEntryForm";
import { reducer, usePersistedReducer } from "./reducer";

const App = () => {
  const [ledger, dispatch] = usePersistedReducer(reducer, []);

  return (
    <main>
      <Router>
        <Switch>
          <Route path="/new">
            <NewEntryForm dispatch={dispatch} />
          </Route>
          <Route path="/">
            <LedgerTable ledger={ledger} dispatch={dispatch} />
          </Route>
        </Switch>
      </Router>
    </main>
  );
};

export default App;
