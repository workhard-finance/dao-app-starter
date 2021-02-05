import React, { Suspense, lazy } from "react";
import Page from "../layouts/Page";
import { Breadcrumb, Container, Row } from "react-bootstrap";
import { importMDX } from "mdx.macro";

const Content = lazy(() => importMDX("../docs/getting-started.mdx"));

const Docs = () => {
  return (
    <Page>
      <Container>
        <Suspense fallback={<div>Loading...</div>}>
          <Content />
        </Suspense>
      </Container>
    </Page>
  );
};

export default Docs;
