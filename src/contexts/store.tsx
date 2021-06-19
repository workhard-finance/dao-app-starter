import React from "react";
import { StableReserveStore } from "../store/stableReserveStore";
import { UserStore } from "../store/userStore";

export const storesContext = React.createContext({
  stableReserveStore: new StableReserveStore(),
  userStore: new UserStore(),
});
