import React from "react";
import { storesContext } from "../contexts/store";

export const useStores = () => React.useContext(storesContext);
