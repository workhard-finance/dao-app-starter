import React from "react";
import store from "../../svgs/store.svg";

const StoreIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={store} alt="store" />;

export default StoreIcon;
