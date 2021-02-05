import React from "react";
import { themes } from "./theme";
import Home from "./pages/Home";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Web3ReactProvider } from "@web3-react/core";
import { providers } from "ethers";
import Farm from "./pages/Farm";
import "./App.css";
import { MenuContext } from "./context";
import { VisionDaoThemeProvider } from "./providers/VisionDaoThemeProvider";
import DocsIcon from "./components/icons/DocsIcon";
import Mine from "./pages/Mine";
import Work from "./pages/Work";
import Vote from "./pages/Vote";
import Docs from "./pages/Docs";

const menus = [
  { path: "/", name: "Home", emoji: <DocsIcon /> },
  { path: "/mining", name: "Mining", emoji: <DocsIcon /> },
  { path: "/farm", name: "Farm", emoji: <DocsIcon /> },
];

const getLibrary = (
  provider:
    | providers.ExternalProvider
    | providers.JsonRpcFetchFunc,
  _: any
) => {
  const library = new providers.Web3Provider(provider); // this will vary according to whether you use e.g. ethers or web3.js
  library.pollingInterval = 12000
};

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <VisionDaoThemeProvider theme={themes.light}>
        <MenuContext.Provider value={menus}>
          <Router>
            {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
            <Switch>
              <Route path="/docs">
                <Docs />
              </Route>
              <Route path="/work">
                <Work />
              </Route>
              <Route path="/vote">
                <Vote />
              </Route>
              <Route path="/mine">
                <Mine />
              </Route>
              <Route path="/farm">
                <Farm />
              </Route>
              <Route path="/">
                <Home />
              </Route>
            </Switch>
          </Router>
        </MenuContext.Provider>
      </VisionDaoThemeProvider>
    </Web3ReactProvider>
  );
}

export default App;
