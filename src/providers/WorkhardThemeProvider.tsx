import React from "react";
import { themes, VisionDaoTheme } from "../theme";
import { useContext } from "react";

export const WorkhardThemeCtx = React.createContext(themes.dark);
export function useVisionDaoTheme() {
  const theme = useContext(WorkhardThemeCtx);
  return theme;
}

export const WorkhardThemeProvider = (props: {
  theme: VisionDaoTheme;
  children: React.ReactNode;
}) => (
  <WorkhardThemeCtx.Provider value={props.theme}>
    {props.children}
  </WorkhardThemeCtx.Provider>
);
