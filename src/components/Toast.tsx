import React from "react";
import { Alert } from "react-bootstrap";
import { ToastProps } from "react-toast-notifications";

const DefaultToast: React.FC<ToastProps> = (props) => {
  const { children } = props;
  const { variant, content } = children as any;
  return (
    <Alert
      style={{ maxWidth: "50rem" }}
      onClose={props.onDismiss}
      variant={variant}
      dismissible
    >
      {content}
    </Alert>
  );
};

export default DefaultToast;
