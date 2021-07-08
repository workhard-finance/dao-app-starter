import React from "react";
import { Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import config from "../../config.json";
import { WHFAppConfig } from "../../types/config";

const NavBarBrand = () => {
  const title = ((config as any) as WHFAppConfig).appName;
  return (
    <Navbar.Brand as={Link} to={`/`}>
      <strong>{title}</strong>
    </Navbar.Brand>
  );
};

export default NavBarBrand;
