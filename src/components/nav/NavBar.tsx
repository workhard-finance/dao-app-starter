import React from "react";
import { Nav, Row, Navbar } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import NavBarBrand from "./NavBarBrand";
import Wallet from "../Wallet";
import { Menu } from "../../contexts/menu";
// import NavBarMenu from "./NavBarMenu";

export interface NavBarProps {
  menus: Menu[];
}

const NavBar: React.FC<NavBarProps> = ({ menus }) => {
  // const menus = useContext(MenuContext);
  // const theme = useWorkhardTheme();
  const history = useHistory();
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
                  history.location.pathname === menu.url ? "green" : undefined,
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
