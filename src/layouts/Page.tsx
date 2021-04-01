import React, { useContext } from "react";
import { Container, Row } from "react-bootstrap";
import FarmIcon from "../components/icons/FarmIcon";
import WorkIcon from "../components/icons/WorkIcon";
import VoteIcon from "../components/icons/VoteIcon";
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
