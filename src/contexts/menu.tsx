import React from "react";
import { PageProps } from "../layouts/Page";

export type Menu = {
  Icon: (...props: any) => JSX.Element;
  name: string;
  url: string;
};

const menus: Menu[] = [];
export const MenuContext = React.createContext(menus);
