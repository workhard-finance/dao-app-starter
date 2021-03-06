import React from "react";
import work from "../../svgs/work.svg";

const WorkIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={work} alt="work" />;

export default WorkIcon;
