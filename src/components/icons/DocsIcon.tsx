import React from "react";
import docs from "../../svgs/docs.svg";

const DocsIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={docs} alt="docs" />;

export default DocsIcon;
