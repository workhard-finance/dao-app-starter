import React, { useContext, ReactNode } from "react";
import {
  AccordionToggleProps,
  AccordionContext,
  useAccordionToggle,
  AccordionToggle,
} from "react-bootstrap";

export const ExtendedAccordionToggle: React.FC<
  AccordionToggleProps & {
    toggled?: ReactNode;
    untoggled?: ReactNode;
    callback?: (key: string) => void;
  }
> = ({ toggled, untoggled, children, eventKey, callback, ...props }) => {
  const currentEventKey = useContext(AccordionContext);

  const decoratedOnClick = useAccordionToggle(
    eventKey,
    () => callback && callback(eventKey)
  );

  const isCurrentEventKey = currentEventKey === eventKey;

  return (
    <AccordionToggle eventKey={eventKey} onClick={decoratedOnClick} {...props}>
      {isCurrentEventKey ? toggled || children : untoggled || children}
    </AccordionToggle>
  );
};
