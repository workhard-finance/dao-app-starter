import React from "react";
import { Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useVisionDaoTheme } from "../../providers/VisionDaoThemeProvider";

const NavBarBrand = (props: React.ComponentProps<any>) => {
  const theme = useVisionDaoTheme();
  return (
    <Navbar.Brand
      {...props}
      as={Link}
      to="/"
      style={{
        fontFamily: theme.typography.fontFamilies.title,
        // color: theme.palette.visionDao.light,
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        fontSize: '4vmin'
      }}
    >
      <strong>WORK HARD</strong>
    </Navbar.Brand>
  );
};

export default NavBarBrand;
