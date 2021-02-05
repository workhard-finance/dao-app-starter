import React from "react";
import farm from "../../svgs/farm.svg";

const FarmIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={farm} alt="farm" />;

export default FarmIcon;
