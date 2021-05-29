import React from "react";
import { themes } from "./theme";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Web3ReactProvider } from "@web3-react/core";
import { getLibrary } from "./web3/provider";
import "./App.css";
import { WorkhardThemeProvider } from "./providers/WorkhardThemeProvider";
import Mine from "./pages/mine";
import Work from "./pages/work";
import Gov from "./pages/gov";
import Res from "./pages/Res";
import Fork from "./pages/fork";
import Store from "./pages/store";
import { WorkhardProvider } from "./providers/WorkhardProvider";
import { Project } from "./pages/etc/Project";
import { BlockNumberProvider } from "./providers/BlockNumberProvider";
import { Manufacture } from "./pages/store/tabs/Manufacture";
import { ForkAndLaunch } from "./pages/fork/ForkAndLaunch";
import { ProductPage } from "./pages/store/tabs/ProductPage";
import { IPFSProvider } from "./providers/IPFSProvider";
import { ToastProvider } from "react-toast-notifications";
import DefaultToast from "./components/Toast";
import Dashboard from "./pages/dashboard/Dashboard";

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
                    <Route path="/:daoId?/store/:tab?" children={<Store />} />
                    <Route path="/:daoId?/res" children={<Res />} />
                    <Route
                      path="/:daoId?/fork/:step/:projId?"
                      children={<ForkAndLaunch />}
                    />
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
                    <Route
                      path="/docs"
                      component={() => {
                        window.location.replace("https://gitbook.io");
                        return null;
                      }}
                    />
                    <Route path="/:daoId?/" children={<Dashboard />} />
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
