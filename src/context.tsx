import React from "react";
import DocsIcon from "./components/icons/DocsIcon";
const menus = [
  { path: "/", name: "Home", emoji: <DocsIcon /> },
  { path: "/mining", name: "Mining", emoji: <DocsIcon /> },
  { path: "/farm", name: "Farm", emoji: <DocsIcon /> },
];
export const MenuContext = React.createContext(menus);
