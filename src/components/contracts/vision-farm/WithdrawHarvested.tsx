import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import {
  Card,
  Button,
  Form,
  InputGroup,
  ProgressBar,
  ListGroup,
} from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { getVariantForProgressBar } from "../../../utils/utils";
import { OverlayTooltip } from "../../OverlayTooltip";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { ConditionalButton } from "../../ConditionalButton";
import {
  CoingeckoTokenDetails,
  getPriceFromCoingecko,
  getTokenDetailsFromCoingecko,
} from "../../../utils/coingecko";

export interface WithdrawHarvestedProps {}

export const WithdrawHarvested: React.FC<WithdrawHarvestedProps> = ({}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();

  const [tokens, setTokens] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<{
    [token: string]: boolean;
  }>({});
  const [amounts, setAmounts] = useState<BigNumber[]>([]);
  const [prices, setPrices] = useState<(number | undefined)[]>([]);
  const [details, setDetails] = useState<(CoingeckoTokenDetails | undefined)[]>(
    []
  );
  const [totalInUSD, setTotalInUSD] = useState<number>(0);
  const [lastTx, setLastTx] = useState<string>();

  useEffect(() => {
    if (!!contracts && !!account) {
      contracts.visionFarm.getAllHarvestedCropsOf(account).then((res) => {
        setSelectedTokens(
          res.tokens.reduce((acc, token) => {
            return { ...acc, [token]: true };
          }, {})
        );
        setTokens(res.tokens);
        setAmounts(res.amounts);
      });
    }
  }, [account, contracts, blockNumber, lastTx]);

  useEffect(() => {
    Promise.all(tokens.map((token) => getPriceFromCoingecko(token))).then(
      setPrices
    );
    Promise.all(
      tokens.map((token) => getTokenDetailsFromCoingecko(token))
    ).then(setDetails);
  }, [tokens]);

  useEffect(() => {
    if (tokens.length === amounts.length && tokens.length === prices.length) {
      const sum = amounts.reduce((acc, curr, i) => {
        return acc + parseFloat(formatEther(curr)) * (prices[i] || 0);
      }, 0);
      setTotalInUSD(sum);
    }
  }, [amounts, prices]);

  const isSynced = () => {
    return tokens.length == prices.length && tokens.length == details.length;
  };

  const valueInUSD = (amount?: BigNumber, price?: number) => {
    if (!!amount && !!price) {
      return parseFloat(formatEther(amount)) * price;
    } else {
      return 0;
    }
  };

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const selected = Object.keys(selectedTokens).filter(
      (token) => selectedTokens[token]
    );
    contracts.visionFarm
      .connect(signer)
      .withdraw(selected)
      .then((tx) => {
        tx.wait().then((receipt) => {
          setLastTx(receipt.transactionHash);
        });
      })
      .catch((err) => alert(err));
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Card.Title>Harvested crops</Card.Title>
      <Card.Text style={{ fontSize: "3rem" }}>$ {totalInUSD}</Card.Text>
      <ListGroup className="list-group-flush">
        {isSynced() &&
          tokens.map((token, i) => {
            <ListGroup.Item>
              <Form.Check
                inline
                label={`$${details[i]?.symbol || "?"}: ${formatEther(
                  amounts[i]
                )} ($${valueInUSD(amounts[i], prices[i])})`}
                defaultChecked={true}
                type="checkbox"
                onChange={() => {
                  const selected = selectedTokens[token];
                  setSelectedTokens({
                    ...selectedTokens,
                    [token]: !selected,
                  });
                }}
              />
            </ListGroup.Item>;
          })}
        ;
      </ListGroup>
      <br />
      <Button variant="primary" type="submit">
        Withdraw harvested crops
      </Button>
    </Form>
  );
};
