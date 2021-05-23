import React from "react";
import { themes } from "./theme";
import Home from "./pages/Home";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Web3ReactProvider } from "@web3-react/core";
import { getLibrary } from "./web3/provider";
import "./App.css";
import { WorkhardThemeProvider } from "./providers/WorkhardThemeProvider";
import Mine from "./pages/mine";
import Work from "./pages/work";
import Gov from "./pages/gov";
import Res from "./pages/Res";
import Fork from "./pages/Fork";
import Store from "./pages/nfts";
import { WorkhardProvider } from "./providers/WorkhardProvider";
import { Project } from "./pages/etc/Project";
import { BlockNumberProvider } from "./providers/BlockNumberProvider";
import { Manufacture } from "./pages/nfts/tabs/Manufacture";
import { ProductPage } from "./pages/nfts/tabs/ProductPage";
import { IPFSProvider } from "./providers/IPFSProvider";
import { ToastProvider } from "react-toast-notifications";
import DefaultToast from "./components/Toast";

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ToastProvider
        components={{ Toast: DefaultToast }}
        autoDismiss={true}
        autoDismissTimeout={60000}
      >
        <IPFSProvider>
          <BlockNumberProvider>
            <Router>
              <WorkhardProvider>
                {/* <WorkhardLoggedDataProvider> */}
                <WorkhardThemeProvider theme={themes.light}>
                  <Switch>
                    <Route
                      path="/:daoId?/work/:tab?/:subtab?"
                      children={<Work />}
                    />
                    <Route path="/:daoId?/mine/:tab?" children={<Mine />} />
                    <Route
                      path="/:daoId?/gov/:tab?/:subtab?"
                      children={<Gov />}
                    />
                    <Route path="/:daoId?/nfts/:tab?" children={<Store />} />
                    <Route path="/:daoId?/res" children={<Res />} />
                    <Route path="/:daoId?/fork" children={<Fork />} />
                    <Route path="/:daoId?/proj/:id" children={<Project />} />
                    <Route
                      path="/:daoId?/product/:address"
                      children={<ProductPage />}
                    />
                    <Route
                      path="/:daoId?/manufacturer/new"
                      children={<Manufacture />}
                    />
                    <Route path="/:daoId?/" children={<Home />} />
                  </Switch>
                </WorkhardThemeProvider>
                {/* </WorkhardLoggedDataProvider> */}
              </WorkhardProvider>
            </Router>
          </BlockNumberProvider>
        </IPFSProvider>
      </ToastProvider>
    </Web3ReactProvider>
  );
}

export default App;
