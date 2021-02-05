import React from "react";
import logo from "../svgs/logo.svg";
import styled from "styled-components";

const Styled = styled.div`
  .Landing-logo {
    height: 20vmin;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    .Landing-logo {
      animation: Landing-logo-spin infinite 20s linear;
    }
  }

  @keyframes Landing-logo-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const SpinningVision = () => (
  <Styled>
    <img src={logo} className="Landing-logo" alt="logo" />
  </Styled>
);
export default SpinningVision;
