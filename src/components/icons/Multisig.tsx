import React from "react";
import multisig from "../../svgs/multisig.svg";

const MultisigIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={multisig} alt="multisig" />;

export default MultisigIcon;
