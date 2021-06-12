import React from "react";
import { StableReserveStore } from "../store/stableReserveStore";
import { UserConfigStore } from "../store/userConfigStore";

export const storesContext = React.createContext({
  stableReserveStore: new StableReserveStore(),
  userConfigStore: new UserConfigStore(),
});
