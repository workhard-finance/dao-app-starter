import React from "react";
import { Nav, Row, Navbar, Button } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import NavBarBrand from "./NavBarBrand";
import Wallet from "../Wallet";
import { Menu } from "../../contexts/menu";

export interface NavBarProps {
  menus: Menu[];
  secondary?: Menu[];
}

const NavBar: React.FC<NavBarProps> = ({ menus, secondary }) => {
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
                color: history.location.pathname.startsWith(menu.url)
                  ? "green"
                  : undefined,
                textDecoration: history.location.pathname.startsWith(menu.url)
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
        {secondary && (
          <>
            <div style={{ borderLeft: "1px solid gray", height: "2rem" }}></div>
            <Nav>
              {secondary.map((menu) => (
                <Nav.Link
                  key={menu.url}
                  as={Link}
                  to={menu.url}
                  style={{
                    color: history.location.pathname.startsWith(menu.url)
                      ? "green"
                      : undefined,
                    textDecoration: history.location.pathname.startsWith(
                      menu.url
                    )
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
          </>
        )}
      </Navbar.Collapse>
      <Row className="justify-content-end">
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          className="justify-content-end"
          style={{ margin: 10 }}
        />
        {secondary && (
          <Button as={Link} to={`/`} style={{ margin: 10 }}>
            Go to Work Hard
          </Button>
        )}
        <Wallet className="justify-content-end" style={{ margin: 10 }} />
      </Row>
    </Navbar>
  );
};

export default NavBar;
