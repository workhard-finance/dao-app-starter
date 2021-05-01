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
            <a href="https://blog.bootswatch.com/rss/">Discord</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://twitter.com/bootswatch">Twitter</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://github.com/thomaspark/bootswatch">GitHub</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://blog.bootswatch.com/">Medium</a>
          </li>
        </ul>
        <br />
        <br />
        <p>
          Made by crypto nomads around the world. Code released under the{" "}
          <a href="https://github.com/thomaspark/bootswatch/blob/master/LICENSE">
            GPL v3 license.
          </a>
        </p>
      </Col>
    </Row>
  </footer>
);

export default Footer;
