import React, { Suspense, lazy } from "react";
import Page from "../layouts/Page";
import { importMDX } from "mdx.macro";

const Content = lazy(() => importMDX("../docs/getting-started.mdx"));

const Docs = () => {
  return (
    <Page>
      <Suspense fallback={<div>Loading...</div>}>
        <Content />
      </Suspense>
    </Page>
  );
};

export default Docs;
