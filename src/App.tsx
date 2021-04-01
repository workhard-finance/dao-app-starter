import React from "react";
import { themes } from "./theme";
import Home from "./pages/Home";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Web3ReactProvider } from "@web3-react/core";
import { getLibrary } from "./web3/provider";
import Farm from "./pages/Farm";
import "./App.css";
import { WorkhardThemeProvider } from "./providers/WorkhardThemeProvider";
import Mine from "./pages/Mine";
import Work from "./pages/Work";
import Vote from "./pages/Vote";
import Docs from "./pages/Docs";
import { WorkhardContractsProvider } from "./providers/WorkhardContractProvider";

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <WorkhardContractsProvider>
        {/* <WorkhardLoggedDataProvider> */}
        <WorkhardThemeProvider theme={themes.light}>
          <Router>
            <Switch>
              <Route path="/farm">
                <Farm />
              </Route>
              <Route path="/mine">
                <Mine />
              </Route>
              <Route path="/work">
                <Work />
              </Route>
              <Route path="/vote">
                <Vote />
              </Route>
              <Route path="/docs">
                <Docs />
              </Route>
              <Route path="/">
                <Home />
              </Route>
            </Switch>
          </Router>
        </WorkhardThemeProvider>
        {/* </WorkhardLoggedDataProvider> */}
      </WorkhardContractsProvider>
    </Web3ReactProvider>
  );
}

export default App;
