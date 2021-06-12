import React from "react";
import { StableReserveStore } from "../store/stableReserveStore";

export const storesContext = React.createContext({
  stableReserveStore: new StableReserveStore(),
});
