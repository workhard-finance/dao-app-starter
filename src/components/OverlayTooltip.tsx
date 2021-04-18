import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export interface OverlayTooltipProps {
  tip: string;
}

export const OverlayTooltip: React.FC<OverlayTooltipProps> = ({
  tip,
  children,
}) => (
  <OverlayTrigger
    // key={placement}
    // placement={placement}
    overlay={<Tooltip id={`tooltip`}>{tip}</Tooltip>}
  >
    <>{children}</>
    {/* <span style={{ fontSynthesis: "o" }}>❔</span> */}
  </OverlayTrigger>
);
