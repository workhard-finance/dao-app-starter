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
import Docs from "./pages/Docs";
import Store from "./pages/nfts";
import { WorkhardContractsProvider } from "./providers/WorkhardContractProvider";
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
            <WorkhardContractsProvider>
              {/* <WorkhardLoggedDataProvider> */}
              <WorkhardThemeProvider theme={themes.light}>
                <Router>
                  <Switch>
                    <Route path="/work" children={<Work />} />
                    <Route path="/mine" children={<Mine />} />
                    <Route path="/gov" children={<Gov />} />
                    <Route path="/store" children={<Store />} />
                    <Route path="/about" children={<Docs />} />
                    <Route path="/proj/:id" children={<Project />} />
                    <Route
                      path="/product/:address"
                      children={<ProductPage />}
                    />
                    <Route
                      path="/manufacturer/new"
                      children={<Manufacture />}
                    />
                    <Route path="/" children={<Home />} />
                  </Switch>
                </Router>
              </WorkhardThemeProvider>
              {/* </WorkhardLoggedDataProvider> */}
            </WorkhardContractsProvider>
          </BlockNumberProvider>
        </IPFSProvider>
      </ToastProvider>
    </Web3ReactProvider>
  );
}

export default App;
