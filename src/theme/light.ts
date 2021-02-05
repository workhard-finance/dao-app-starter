import { createTheme } from "./utils";

const light = createTheme({
  typography: {
    fontFamilies: {
      display: "Merriweather Sans",
      mono: "Merriweather Sans",
      ui: "Merriweather Sans",
      // title: "Unica One",
      // title: "Nosifer",
      // title: "Secular One",
      title: "Cabin Sketch",
      // title: "Fredericka the Great",
      // title: "Fredericka the Great",
      // title: "Hanalei",
    },
  },
  palette: {
    visionDao: {
      base: "#52057b",
      dark: "#000000",
      light: "#2aa198",
      lightest: "#bc6ff1",
      signature: "black",
      // base: "#fbbedf",
      // dark: "#fca3cc",
      // light: "#fdcfdf",
      // lightest: "#bce6eb",
      // signature: "black",
    },
  },
});

export default light;
