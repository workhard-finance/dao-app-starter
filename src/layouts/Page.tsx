import React, { useContext } from "react";
import { Container, Row } from "react-bootstrap";

import NavBar from "../components/nav/NavBar";
import Footer from "../components/Footer";
import { useVisionDaoTheme } from "../providers/WorkhardThemeProvider";
import { MenuContext } from "../contexts/menu";

export type PageProps = React.ComponentProps<any>;

const Page = (props: React.ComponentProps<any>) => {
  const menus = useContext(MenuContext);
  const theme = useVisionDaoTheme();
  console.log(theme.palette.visionDao.dark);
  console.dir(theme.palette.visionDao);
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
