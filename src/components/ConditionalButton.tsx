import React from "react";
import {
  Button,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import { ButtonProps } from "react-bootstrap";

export interface ConditonalButtonProps extends ButtonProps {
  enabledWhen?: boolean;
  whyDisabled: string;
}

export const ConditionalButton: React.FC<ConditonalButtonProps> = ({
  enabledWhen,
  whyDisabled,
  ...props
}) => {
  return (
    <OverlayTrigger
      show={enabledWhen ? false : undefined}
      overlay={<Tooltip id={``}>{whyDisabled}</Tooltip>}
    >
      <Button
        disabled={!enabledWhen}
        {...props}
      />
    </OverlayTrigger>
  );
};
