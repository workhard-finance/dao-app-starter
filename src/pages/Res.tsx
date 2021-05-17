import React, { Suspense, lazy } from "react";
import Page from "../layouts/Page";
import { importMDX } from "mdx.macro";

const Content = lazy(() => importMDX("../docs/res.mdx"));

const Res = () => {
  return (
    <Page>
      <Suspense fallback={<div>Loading...</div>}>
        <Content />
      </Suspense>
    </Page>
  );
};

export default Res;
