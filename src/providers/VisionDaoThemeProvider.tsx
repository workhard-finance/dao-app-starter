import React from "react";
import { themes, VisionDaoTheme } from "../theme";
import { useContext } from "react";

export const VisionDaoThemeCtx = React.createContext(themes.dark);
export function useVisionDaoTheme() {
  const theme = useContext(VisionDaoThemeCtx);
  return theme;
}

export const VisionDaoThemeProvider = (props: {
  theme: VisionDaoTheme;
  children: React.ReactNode;
}) => (
  <VisionDaoThemeCtx.Provider value={props.theme}>
    {props.children}
  </VisionDaoThemeCtx.Provider>
);
