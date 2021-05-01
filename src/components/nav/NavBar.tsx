import React from "react";
import { Nav, Row, Navbar } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import NavBarBrand from "./NavBarBrand";
import Wallet from "../Wallet";
import { Menu } from "../../contexts/menu";

export interface NavBarProps {
  menus: Menu[];
}

const NavBar: React.FC<NavBarProps> = ({ menus }) => {
  const history = useHistory();
  return (
    <Navbar expand="lg" className="navbar-light bg-light">
      <NavBarBrand />
      <Navbar.Collapse>
        <Nav>
          {menus.map((menu) => (
            <Nav.Link
              key={menu.url}
              as={Link}
              to={menu.url}
              style={{
                color:
                  history.location.pathname === menu.url ? "green" : undefined,
                textDecoration:
                  history.location.pathname === menu.url
                    ? "underline"
                    : undefined,
                textAlign: "center",
              }}
            >
              <menu.Icon style={{ height: "2rem" }} />
              <br />
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
