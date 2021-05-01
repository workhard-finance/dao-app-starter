import { hexlify, randomBytes } from "ethers/lib/utils";
import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export interface OverlayTooltipProps {
  tip: React.ReactElement | string;
  tooltipStyle?: React.CSSProperties;
  text?: string;
}

export const OverlayTooltip: React.FC<OverlayTooltipProps> = ({
  tip,
  tooltipStyle,
  children,
  text,
}) => (
  <OverlayTrigger
    overlay={
      <Tooltip style={tooltipStyle} id={`tooltip-${hexlify(randomBytes(8))}`}>
        {tip}
      </Tooltip>
    }
    children={text ? <span>{text}</span> : <span>{children}</span>}
  />
);
