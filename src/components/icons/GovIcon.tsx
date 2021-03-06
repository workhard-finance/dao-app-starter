import React from "react";
import vote from "../../svgs/gov.svg";

const VoteIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={vote} alt="vote" />;

export default VoteIcon;
