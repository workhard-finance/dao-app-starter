import React from "react";
import { themes, WorkhardTheme } from "../theme";
import { useContext } from "react";

export const WorkhardThemeCtx = React.createContext(themes.dark);
export function useWorkhardTheme() {
  const theme = useContext(WorkhardThemeCtx);
  return theme;
}

export const WorkhardThemeProvider = (props: {
  theme: WorkhardTheme;
  children: React.ReactNode;
}) => (
  <WorkhardThemeCtx.Provider value={props.theme}>
    {props.children}
  </WorkhardThemeCtx.Provider>
);
