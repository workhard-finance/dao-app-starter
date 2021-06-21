import React from "react";
import { StableReserveStore } from "../store/stableReserveStore";
import { MineStore } from "../store/mineStore";
import { UserStore } from "../store/userStore";

export const storesContext = React.createContext({
  stableReserveStore: new StableReserveStore(),
  mineStore: new MineStore(),
  userStore: new UserStore(),
});
