import { createTheme } from "./utils";

const dark = createTheme({
  palette: {
    visionDao: {
      base: "#98ACF8",
      dark: "#B088F9",
      light: "#DA9FF9",
      lightest: "#BEDCFA",
      signature: "black",
    },
  },
  typography: {
    fontFamilies: {
      display: "Fredericka the Great",
      mono: "Fredericka the Great",
      ui: "Fredericka the Great",
      // title: "Fredericka the Great",
      title: "Hanalei",
    },
  },
});

export default dark;
