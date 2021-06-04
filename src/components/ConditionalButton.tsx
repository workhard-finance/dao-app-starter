import { hexlify, randomBytes } from "ethers/lib/utils";
import React from "react";
import { Button, Tooltip, OverlayTrigger } from "react-bootstrap";
import { ButtonProps } from "react-bootstrap";

export interface ConditonalButtonProps extends ButtonProps {
  enabledWhen?: boolean;
  whyDisabled: string;
  tooltip?: string;
  to?: string;
}

export const ConditionalButton: React.FC<ConditonalButtonProps> = ({
  enabledWhen,
  whyDisabled,
  to,
  tooltip,
  ...props
}) => {
  return (
    <OverlayTrigger
      show={
        enabledWhen ? (tooltip !== undefined ? undefined : false) : undefined
      }
      overlay={
        <Tooltip id={`tooltip-${hexlify(randomBytes(8))}`}>
          {enabledWhen ? tooltip : whyDisabled}
        </Tooltip>
      }
    >
      <Button disabled={!enabledWhen} {...props} to={to} />
    </OverlayTrigger>
  );
};
