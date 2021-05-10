import React from "react";
import fountain from "../../svgs/fountain.svg";

const PoolIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={fountain} alt="pool" />;

export default PoolIcon;
