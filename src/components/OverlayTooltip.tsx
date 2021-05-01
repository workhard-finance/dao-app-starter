import { randomBytes } from "@ethersproject/random";
import { randomInt } from "crypto";
import React from "react";
import { OverlayTriggerProps } from "react-bootstrap";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export interface OverlayTooltipProps {
  tip: string;
  text?: string;
}

export const OverlayTooltip: React.FC<OverlayTooltipProps> = ({
  tip,
  children,
  text,
}) => (
  <OverlayTrigger
    overlay={<Tooltip id={`tooltip`}>{tip}</Tooltip>}
    children={text ? <span>{text}</span> : <span>{children}</span>}
  />
);
