import React from "react";
import { Button, Col, Nav, Row, Tab, Tabs } from "react-bootstrap";
import { BuyCommit } from "../../components/contracts/stable-reserve/BuyCommit";
import { RedeemCommit } from "../../components/contracts/stable-reserve/RedeemCommit";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";

const StableReserve: React.FC = () => {
  const { subtab } = useParams<{ subtab?: string }>();
  const history = useHistory();
  return (
    <Tab.Container defaultActiveKey={subtab || "buy"}>
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="buy">Buy $COMMIT</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="redeem">Redeem</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="faq">FAQ</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane
              eventKey="buy"
              onEnter={() => history.push("/work/reserve/buy")}
            >
              <BuyCommit />
              <br />
              <Button variant={"info"} children="Trade $COMMIT on Uniswap" />
            </Tab.Pane>
            <Tab.Pane
              eventKey="redeem"
              onEnter={() => history.push("/work/reserve/redeem")}
            >
              <RedeemCommit />
            </Tab.Pane>
            <Tab.Pane
              eventKey="faq"
              onEnter={() => history.push("/work/reserve/faq")}
            >
              <h5>
                <strong>What can I do with $COMMIT?</strong>
              </h5>
              <p>
                Contributors get compensation by $COMMIT instead of $DAI, but
                they still can redeem for $DAI as the stable reserve always
                reserves enough $DAI for the redemption. Otherwise, you can
                choose to burn to get $VISION emission. Around 40~50% of the
                total VISION emission goes to whom contributed to the protocol.
                As contributors burn their $COMMIT to get $VISION, the Stable
                Reserve has extra $COMMIT that can be paid to other
                contributors. Therefore, the mechanism between $VISION and
                $COMMIT works like a liquid stock option.
                <br />
                <br />
                In conclusion, if you need money right now redeem $COMMIT for
                $DAI at the Stable Reserve. Or if you believe in the success of
                this protocol, choose to burn your $COMMIT to get more $VISION.
              </p>
              <h5>
                <strong>Why $COMMIT is pegged between $1 ~ $2?</strong>
              </h5>
              <p>
                Although, you can earn $COMMIT by contributing to the protocol,
                you can also buy them via secondary markets like Sushiswap. As a
                big portion of $VISION emission goes to $COMMIT burners, $COMMIT
                price can be overheated in the market. By the way, it is nice
                for you that your $COMMIT deserves more than 1 $DAI. However,
                Stable Reserve also offers an option to buy $COMMIT directly
                through it with the price of $2 DAI per 1 COMMIT. So, if $COMMIT
                gets too expensive, people can do arbitrage between the reserve
                and the secondary markets and the Stable Reserve can mint more
                $COMMITs for grants.
              </p>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};

export default StableReserve;
