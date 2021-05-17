import React from "react";
import dup from "../../svgs/duplicate.svg";

const DupIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={dup} alt="duplicate" />;

export default DupIcon;
