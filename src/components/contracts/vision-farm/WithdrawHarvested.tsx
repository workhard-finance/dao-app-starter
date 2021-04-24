import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import {
  Card,
  Button,
  Form,
  InputGroup,
  ProgressBar,
  ListGroup,
  Col,
} from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, getAddress, parseEther } from "ethers/lib/utils";
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
  const [tokensToWithdraw, setTokensToWithdraw] = useState<string[]>([]);
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
    setTokensToWithdraw(tokens);
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
    contracts.visionFarm
      .connect(signer)
      .withdraw(tokensToWithdraw)
      .then((tx) => {
        tx.wait().then((receipt) => {
          setLastTx(receipt.transactionHash);
        });
      })
      .catch((err) => alert(err));
  };

  const isChecked = (addr: string): boolean => {
    return (
      tokensToWithdraw?.find((t) => getAddress(t) === getAddress(addr)) !==
      undefined
    );
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Card.Title>Harvested</Card.Title>
      <Card.Text style={{ fontSize: "3rem" }}>$ {totalInUSD}</Card.Text>
      {tokens.length > 0 && (
        <ListGroup className="list-group-flush">
          {isSynced() &&
            tokens.map((token, i) => (
              <ListGroup.Item>
                <Col>
                  <Form.Check
                    label={`$${details[i]?.symbol || "?"}: ${formatEther(
                      amounts[i]
                    )} ($${valueInUSD(amounts[i], prices[i])})`}
                    type="checkbox"
                    onChange={(_) => {
                      const _tokensToWithdraw = isChecked(token)
                        ? tokensToWithdraw?.filter(
                            (t) => getAddress(t) !== getAddress(token)
                          )
                        : [...(tokensToWithdraw || []), token];
                      setTokensToWithdraw(_tokensToWithdraw);
                    }}
                    checked={isChecked(token)}
                  />
                </Col>
              </ListGroup.Item>
            ))}
        </ListGroup>
      )}
      <br />
      <Button variant="primary" type="submit">
        Withdraw harvested crops
      </Button>
    </Form>
  );
};
