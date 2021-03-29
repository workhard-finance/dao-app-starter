import { CustomTheme } from "./custom";

export type WorkhardTheme = CustomTheme;

export function createTheme(custom: CustomTheme): WorkhardTheme {
  // const theme = deepmerge(defaultTheme, custom);
  return custom;
}
