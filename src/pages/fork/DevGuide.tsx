import { BigNumberish } from "ethers";
import React from "react";
import { Button } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { ConditionalButton } from "../../components/ConditionalButton";
import { prefix } from "../../utils/utils";

export const DevGuide: React.FC<{ id?: BigNumberish }> = ({ id }) => {
  const { projId } = useParams<{ step: string; projId?: string }>();

  return (
    <div>
      Congratulations! You now have your own token economy that empowers your
      community by sharing your protocol's vision and giving them rights.
      Community members who commit more will get more compensations and who
      leave first will get less compensation.
      <br />
      <br />
      And, you must keep in mind that your own token will not have any intrinsic
      value until you connect your protocol's revenue stream.
      <br />
      <br />
      Here's how to connect them to your DAO.
      <ol>
        <li>
          From external owned accounts(e.g., Metamask)
          <ul>
            <li>
              Go to{" "}
              <Link to={prefix(projId, "/gov/dividend/distribute")}>
                [gov {`>`} Escrow {`&`} Dividend {`>`} Distribute]
              </Link>
            </li>
            <li>Set up amount and click distribute!</li>
          </ul>
        </li>
        <li>
          Or you can implement your own smart contract
          <ul>
            <li>
              Define interface.
              <pre style={{ padding: 10 }}>
                {`interface IDividendPool {
    function distribute(address token, uint256 amount) external;
}`}
              </pre>
            </li>
            <li>
              Call distribute() in your contract.
              <pre style={{ padding: 10 }}>
                {`contract YourApp {
    function buy(uint256 amount) external {
        ...
        IDividendPool(pool).distribute(DAI, fee);
    }
}`}
              </pre>
            </li>
          </ul>
        </li>
      </ol>
      Cool! Everything is ready!
      <br />
      <br />
      <ConditionalButton
        variant="info"
        as={Link}
        to={prefix(projId, "/dashboard")}
        enabledWhen={!!projId}
        whyDisabled={"This is a preview"}
        children="Go to dashboard"
      />
    </div>
  );
};
