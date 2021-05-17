import React, { useContext } from "react";
import { Container, Row } from "react-bootstrap";
import WorkIcon from "../components/icons/WorkIcon";
import GovIcon from "../components/icons/GovIcon";
import StoreIcon from "../components/icons/StoreIcon";
import MineIcon from "../components/icons/MineIcon";
import DocsIcon from "../components/icons/DocsIcon";
import DupIcon from "../components/icons/DupIcon";
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
      Icon: GovIcon,
      name: "Gov",
      url: "/gov",
    },
    {
      Icon: StoreIcon,
      name: "NFTs",
      url: "/store",
    },
    {
      Icon: DupIcon,
      name: "Fork",
      url: "/fork",
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
