import React from "react";
import vision from "../../svgs/logo.svg";

const VisionIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={vision} alt="vision" />;

export default VisionIcon;
