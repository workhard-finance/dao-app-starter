import React from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";

const StableReserve: React.FC = () => {
  return (
    <Row>
      <Col md={{ span: 6, offset: 3 }}>
        <Card style={{ marginTop: "8vh", marginBottom: "8vh" }}>
          <Card.Body>
            <Card.Text>
              Do you want to build your own team with Commit Mining Framework?
              Or do you want to tokenize your revenue stream? We're preparing a
              launch pad that you can fork Workhard's system without any code
              experience. It'll include emission, governance, and the
              marketplace system and etc. If you have a good idea, please get in
              touch with the core dev members with this form. Or visit discord
              and let's talk!
            </Card.Text>
            <Form
              action="https://getform.io/f/50aa6b47-3b02-4455-a841-29e2c7f41441"
              method="POST"
            >
              <Form.Group>
                <Form.Label>Your name?</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="Jean Calvin"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Email to get reply?</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="jean.calvin@example.com"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>What's your plan?</Form.Label>
                <Form.Control
                  type="text"
                  name="message"
                  placeholder="Please describe your plan here!"
                  as="textarea"
                />
              </Form.Group>
              <Form.Group>
                <Button variant="primary" type="submit">
                  Submit
                </Button>
              </Form.Group>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default StableReserve;
