import React from "react";
import market from "../../svgs/market.svg";

const MarketIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={market} alt="market" />;

export default MarketIcon;
