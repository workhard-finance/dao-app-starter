import React, { useContext } from "react";
import { Container, Row } from "react-bootstrap";
import FarmIcon from "../components/icons/FarmIcon";
import WorkIcon from "../components/icons/WorkIcon";
import VoteIcon from "../components/icons/VoteIcon";
import MarketIcon from "../components/icons/MarketIcon";
import MineIcon from "../components/icons/MineIcon";
import DocsIcon from "../components/icons/DocsIcon";
import NavBar from "../components/nav/NavBar";
import Footer from "../components/Footer";
import { useWorkhardTheme } from "../providers/WorkhardThemeProvider";
import { Menu, MenuContext } from "../contexts/menu";

export type PageProps = React.ComponentProps<any>;

const Page = (props: React.ComponentProps<any>) => {
  const theme = useWorkhardTheme();
  const menus: Menu[] = [
    {
      Icon: WorkIcon,
      name: "Work",
      url: "/work",
    },
    {
      Icon: MineIcon,
      name: "Mine",
      url: "/mine",
    },
    {
      Icon: FarmIcon,
      name: "Farm",
      url: "/farm",
    },
    {
      Icon: VoteIcon,
      name: "Vote",
      url: "/vote",
    },
    {
      Icon: MarketIcon,
      name: "Market",
      url: "/market",
    },
  ];
  return (
    <Container style={{ minHeight: "100vh" }}>
      <br />
      <NavBar menus={menus} />
      <br />
      <Row>
        <Container>{props.children}</Container>
      </Row>
      <br />
      <hr style={{ borderTop: "1px solid rgba(0,0,0,0.5)" }} />
      <Footer />
    </Container>
  );
};

export default Page;
