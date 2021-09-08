import {
  configureStore,
  createSlice,
  createSelector,
  PayloadAction,
} from "@reduxjs/toolkit";
import { toComputedLedger } from "@fifo/ledger";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { applyLedgerItem, AppStateItem } from "./app-state";
import { coinbaseApi } from "./coinbase";

const DEFEAULT_EVENTS: AppStateItem[] = [];
const eventsSlice = createSlice({
  initialState: DEFEAULT_EVENTS,
  name: "events",
  reducers: {
    insert: (state, action: PayloadAction<AppStateItem>) => {
      state.push(action.payload);
    },
  },
});

export const { insert: insertEvent } = eventsSlice.actions;

export const store = configureStore({
  reducer: {
    events: eventsSlice.reducer,
    [coinbaseApi.reducerPath]: coinbaseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => [
    ...getDefaultMiddleware(),
    coinbaseApi.middleware,
  ],
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
const typedSelector = <T>(selector: (state: RootState) => T) => selector;

export const eventsSelector = typedSelector((state) => state.events);
export const ledgerSelector = createSelector(eventsSelector, (events) =>
  events.reduce(applyLedgerItem, [])
);
export const computedLedgerSelector = createSelector(ledgerSelector, (ledger) =>
  toComputedLedger(ledger)
);
