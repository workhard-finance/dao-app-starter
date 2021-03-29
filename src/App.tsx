import React from "react";
import { themes } from "./theme";
import Home from "./pages/Home";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Web3ReactProvider } from "@web3-react/core";
import { getLibrary } from "./web3/provider";
import Farm from "./pages/Farm";
import "./App.css";
import { Menu, MenuContext } from "./contexts/menu";
import { WorkhardThemeProvider } from "./providers/WorkhardThemeProvider";
import Mine from "./pages/Mine";
import Work from "./pages/Work";
import Vote from "./pages/Vote";
import Docs from "./pages/Docs";
import FarmIcon from "./components/icons/FarmIcon";
import WorkIcon from "./components/icons/WorkIcon";
import VoteIcon from "./components/icons/VoteIcon";
import MineIcon from "./components/icons/MineIcon";
import DocsIcon from "./components/icons/DocsIcon";
const menus: Menu[] = [
  {
    Icon: FarmIcon,
    Page: Farm,
    name: "Farm",
    url: "/farm",
  },
  {
    Icon: MineIcon,
    Page: Mine,
    name: "Mine",
    url: "/mine",
  },
  {
    Icon: WorkIcon,
    Page: Work,
    name: "Work",
    url: "/work",
  },
  {
    Icon: VoteIcon,
    Page: Vote,
    name: "Vote",
    url: "/vote",
  },
  {
    Icon: DocsIcon,
    Page: Docs,
    name: "Docs",
    url: "/docs",
  },
];

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <WorkhardThemeProvider theme={themes.light}>
        <MenuContext.Provider value={menus}>
          <Router>
            {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
            <Switch>
              {menus.map((menu) => (
                <Route path={menu.url}>{menu.Page}</Route>
              ))}
              <Route path="/">
                <Home />
              </Route>
            </Switch>
          </Router>
        </MenuContext.Provider>
      </WorkhardThemeProvider>
    </Web3ReactProvider>
  );
}

export default App;
