import React from "react";

export type Menu = {
  name: string;
  url: string;
};

const menus: Menu[] = [];
export const MenuContext = React.createContext(menus);
