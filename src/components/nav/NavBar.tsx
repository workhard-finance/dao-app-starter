import React from "react";
import { Nav, Row, Navbar } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import NavBarBrand from "./NavBarBrand";
import FarmIcon from "../icons/FarmIcon";
import WorkIcon from "../icons/WorkIcon";
import VoteIcon from "../icons/VoteIcon";
import MineIcon from "../icons/MineIcon";
import DocsIcon from "../icons/DocsIcon";
import Wallet from "../Wallet";
// import NavBarMenu from "./NavBarMenu";

type Menu = {
  Icon: (...props: any) => JSX.Element;
  name: string;
  url: string;
};

const NavBar = (props: React.ComponentProps<any>) => {
  // const menus = useContext(MenuContext);
  // const theme = useVisionDaoTheme();
  const history = useHistory();
  const menus: Menu[] = [
    {
      Icon: FarmIcon,
      name: "Farm",
      url: "/farm",
    },
    {
      Icon: MineIcon,
      name: "Mine",
      url: "/mine",
    },
    {
      Icon: WorkIcon,
      name: "Work",
      url: "/work",
    },
    {
      Icon: VoteIcon,
      name: "Vote",
      url: "/vote",
    },
    {
      Icon: DocsIcon,
      name: "Docs",
      url: "/docs",
    },
  ];
  return (
    <Navbar expand="lg" className="navbar-light bg-light">
      <NavBarBrand />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav
          // className="mr-auto"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "end",
          }}
        >
          {menus.map((menu) => (
            <Nav.Link
              as={Link}
              to={menu.url}
              style={{
                color:
                  history.location.pathname === menu.url
                    ? "green"
                    : undefined,
                textDecoration:
                  history.location.pathname === menu.url
                    ? "underline"
                    : undefined,
              }}
            >
              <menu.Icon />
              {menu.name}
            </Nav.Link>
          ))}
        </Nav>
      </Navbar.Collapse>
      <Row className="justify-content-end">
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          className="justify-content-end"
          style={{ margin: 10 }}
        />
        <Wallet className="justify-content-end" style={{ margin: 10 }} />
      </Row>
    </Navbar>
  );
};

export default NavBar;
