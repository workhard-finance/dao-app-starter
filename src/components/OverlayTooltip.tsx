import { hexlify, randomBytes } from "ethers/lib/utils";
import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Placement } from "react-bootstrap/esm/Overlay";

export interface OverlayTooltipProps {
  tip: React.ReactElement | string;
  tooltipStyle?: React.CSSProperties;
  text?: string;
  placement?: Placement;
}

export const OverlayTooltip: React.FC<OverlayTooltipProps> = ({
  tip,
  tooltipStyle,
  children,
  text,
  placement,
}) => (
  <OverlayTrigger
    placement={placement || "right"}
    overlay={
      <Tooltip
        style={{ fontSize: "1rem", ...tooltipStyle }}
        id={`tooltip-${hexlify(randomBytes(8))}`}
      >
        {tip}
      </Tooltip>
    }
    children={text ? <span>{text}</span> : <span>{children}</span>}
  />
);
