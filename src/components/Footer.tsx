import React from "react";
import { Row, Col } from "react-bootstrap";

const Footer = () => (
  <footer>
    <Row>
      <Col lg={12}>
        <ul className="list-unstyled">
          <li className="float-lg-right">
            <a href="#top">Back to top</a>
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
        </ul>
        <br />
        <br />
        <p>
          Made by crypto nomads around the world. Code released under the{" "}
          <a href="https://github.com/workhard-finance/protocol/blob/master/LICENSE">
            GPL v3 license.
          </a>
        </p>
      </Col>
    </Row>
  </footer>
);

export default Footer;
