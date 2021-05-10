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
import Work from "./pages/work/Work";
import Gov from "./pages/gov/Gov";
import Docs from "./pages/Docs";
import Store from "./pages/Store";
import { WorkhardContractsProvider } from "./providers/WorkhardContractProvider";
import Project from "./pages/Project";
import { BlockNumberProvider } from "./providers/BlockNumberProvider";
import Manufacture from "./pages/Manufacture";
import { IPFSProvider } from "./providers/IPFSProvider";
import ProductPage from "./pages/ProductPage";

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <IPFSProvider>
        <BlockNumberProvider>
          <WorkhardContractsProvider>
            {/* <WorkhardLoggedDataProvider> */}
            <WorkhardThemeProvider theme={themes.light}>
              <Router>
                <Switch>
                  <Route path="/work" children={<Work />} />
                  <Route path="/mine" children={<Mine />} />
                  <Route path="/gov" children={<Gov />} />
                  <Route path="/farm" children={<Farm />} />
                  <Route path="/store" children={<Store />} />
                  <Route path="/about" children={<Docs />} />
                  <Route path="/proj/:id" children={<Project />} />
                  <Route path="/product/:address" children={<ProductPage />} />
                  <Route path="/manufacturer/new" children={<Manufacture />} />
                  <Route path="/" children={<Home />} />
                </Switch>
              </Router>
            </WorkhardThemeProvider>
            {/* </WorkhardLoggedDataProvider> */}
          </WorkhardContractsProvider>
        </BlockNumberProvider>
      </IPFSProvider>
    </Web3ReactProvider>
  );
}

export default App;
