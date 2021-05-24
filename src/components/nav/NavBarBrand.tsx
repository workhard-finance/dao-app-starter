import React from "react";
import { Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { useWorkhardTheme } from "../../providers/WorkhardThemeProvider";

const NavBarBrand = (props: React.ComponentProps<any>) => {
  const theme = useWorkhardTheme();
  const workhard = useWorkhard();
  const forked = workhard?.daoId !== 0 ? workhard?.daoId : undefined;
  return (
    <Navbar.Brand
      {...props}
      as={Link}
      to={forked ? `/${forked}/nfts` : `/`}
      style={{
        fontFamily: theme.typography.fontFamilies.title,
        // color: theme.palette.workhard.light,
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        fontSize: "4vmin",
      }}
    >
      <strong>{forked ? workhard?.name : `WORKHARD`}</strong>
    </Navbar.Brand>
  );
};

export default NavBarBrand;
