import React from "react";
import mine from "../../svgs/mine.svg";

const MineIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={mine} alt="mine" />;

export default MineIcon;
