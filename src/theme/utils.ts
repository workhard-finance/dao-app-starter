import { CustomTheme } from "./custom";

export type VisionDaoTheme = CustomTheme;

export function createTheme(custom: CustomTheme): VisionDaoTheme {
  // const theme = deepmerge(defaultTheme, custom);
  return custom;

}
