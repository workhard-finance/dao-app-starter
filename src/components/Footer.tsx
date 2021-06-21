import React from "react";
import { Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

const Footer = () => (
  <Row style={{ marginTop: "auto", position: "relative" }}>
    <Col lg={12}>
      <hr style={{ borderTop: "1px solid rgba(0,0,0,0.5)" }} />
      <footer>
        <ul className="list-unstyled">
          <li className="float-lg-right">
            <a href="#top">Back to top</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://forum.workhard.finance">Forum</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://discord.gg/eYCcusjXUr">Discord</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://twitter.com/workhardfinance">Twitter</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://github.com/workhard-finance">GitHub</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://medium.com/@Cutshamache">Medium</a>
          </li>
          {/* <li className="float-lg-left" style={{ marginRight: 10 }}>
            <Link to={"/res"}>Resources</Link>
          </li> */}
        </ul>
        <br />
        <br />
        <p>
          Made by crypto nomads around the world. Code released under the{" "}
          <a href="https://github.com/workhard-finance/protocol/blob/master/LICENSE">
            GPL v3 license.
          </a>
        </p>
      </footer>
    </Col>
  </Row>
);

export default Footer;
