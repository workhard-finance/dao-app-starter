import React from "react";
import { PageProps } from "../layouts/Page";

export type Menu = {
  Icon: (...props: any) => JSX.Element;
  Page: React.FC<PageProps>;
  name: string;
  url: string;
};

const menus: Menu[] = [];
export const MenuContext = React.createContext(menus);
