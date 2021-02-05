import React from "react";
import coin from "../../svgs/coin.svg";

const CoinIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={coin} alt="coin" />;

export default CoinIcon;
