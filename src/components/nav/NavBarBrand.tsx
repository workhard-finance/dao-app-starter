import React from "react";
import { Navbar } from "react-bootstrap";
import { Link, useRouteMatch } from "react-router-dom";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { useWorkhardTheme } from "../../providers/WorkhardThemeProvider";

const NavBarBrand = (props: React.ComponentProps<any>) => {
  const theme = useWorkhardTheme();
  const match = useRouteMatch<{ daoId?: string }>("/:daoId?/");
  const parsed = parseInt(match?.params.daoId || "0");
  const daoId = Number.isNaN(parsed) ? 0 : parsed;
  const workhard = useWorkhard();
  const forked = daoId !== 0 ? daoId : undefined;
  return (
    <Navbar.Brand
      {...props}
      as={Link}
      to={forked ? `/${forked}` : `/`}
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
