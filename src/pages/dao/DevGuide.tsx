import { BigNumberish } from "ethers";
import React from "react";
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
      Here are 3 easy ways to build the intrinsic values!
      <ol>
        <li>
          Using an external owned accounts(e.g., Metamask)
          <ul>
            <li>
              Go to{" "}
              <Link to={prefix(projId, "/gov/dividend/distribute")}>
                [gov {`>`} Escrow {`&`} Dividend {`>`} Distribute]
              </Link>
            </li>
            <li>Fill out the form to set token and amount to distribute.</li>
            <li>Click distribute!</li>
          </ul>
        </li>
        <li>
          Are you building a protocol? Then you can implement your own smart
          contract.
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
        <li>
          Or, try to make your products own digital product and register them to
          the{" "}
          <Link to={prefix(projId, "/manufacturer/new")}>NFT marketplace</Link>{" "}
          that we've created for you!. It supports ERC1155 for now but we're
          looking forward to supporting ERC721 soon with the OpenSea storefront
          integration :)
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
