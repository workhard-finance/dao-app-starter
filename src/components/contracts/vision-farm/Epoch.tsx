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
import { formatEther, getAddress } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { bigNumToFixed, getVariantForProgressBar } from "../../../utils/utils";
import { OverlayTooltip } from "../../OverlayTooltip";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { ConditionalButton } from "../../ConditionalButton";
import {
  CoingeckoTokenDetails,
  getPriceFromCoingecko,
  getTokenDetailsFromCoingecko,
} from "../../../utils/coingecko";

export interface EpochProps {
  epoch: number;
  planting: boolean;
  visionPrice: number;
}

export const Epoch: React.FC<EpochProps> = ({
  epoch,
  planting,
  visionPrice,
}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();

  const [apy, setAPY] = useState<number>();
  const [tokens, setTokens] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<BigNumber[]>([]);
  const [prices, setPrices] = useState<(number | undefined)[]>([]);
  const [details, setDetails] = useState<(CoingeckoTokenDetails | undefined)[]>(
    []
  );
  const [dispatchedFarmers, setDispatchedFarmers] = useState<BigNumber>();
  const [dispatchableFarmers, setDispatchableFarmers] = useState<BigNumber>();
  const [totalFarmers, setTotalFarmers] = useState<BigNumber>();
  const [totalInUSD, setTotalInUSD] = useState<number>(0);
  const [lastTx, setLastTx] = useState<string>();
  const [tokensToHarvest, setTokensToHarvest] = useState<string[]>();

  useEffect(() => {
    if (!!contracts && !!account) {
      contracts.visionFarm.getHarvestableCrops(epoch).then((res) => {
        setTokens(res.tokens);
        setAmounts(res.amounts);
      });
      contracts.visionFarm
        .dispatchedFarmers(account, epoch)
        .then(setDispatchedFarmers);
      contracts.visionFarm
        .dispatchableFarmers(account, epoch)
        .then(setDispatchableFarmers);
      contracts.visionFarm.farms(epoch).then(setTotalFarmers);
    }
  }, [account, contracts, blockNumber, lastTx]);

  useEffect(() => {
    Promise.all(tokens.map((token) => getPriceFromCoingecko(token))).then(
      setPrices
    );
    Promise.all(
      tokens.map((token) => getTokenDetailsFromCoingecko(token))
    ).then(setDetails);
    setTokensToHarvest(tokens);
  }, [tokens]);

  useEffect(() => {
    if (amounts.length === prices.length) {
      const sum = amounts.reduce(
        (acc, amount, i) => acc + bigNumToFixed(amount) * (prices[i] || 0),
        0
      );
      setTotalInUSD(sum);
    }
  }, [amounts, prices, dispatchedFarmers, totalFarmers]);
  useEffect(() => {
    if (tokens.length === amounts.length && tokens.length === prices.length) {
      const sum = amounts.reduce((acc, curr, i) => {
        return acc + bigNumToFixed(curr) * (prices[i] || 0);
      }, 0);
      setTotalInUSD(sum);
    }
  }, [amounts, prices]);

  useEffect(() => {
    const maxLock = 50;
    if (!totalFarmers || totalFarmers.eq(0)) {
      setAPY(Infinity);
    } else {
      const earnPerFarmer = totalInUSD / bigNumToFixed(totalFarmers);
      const earnPerVisionWithMaxLock = earnPerFarmer * maxLock;
      const yearlyEarnPerVisionWithMaxLock =
        earnPerVisionWithMaxLock * (52 / 4);
      const apyInPercent = (yearlyEarnPerVisionWithMaxLock * 100) / visionPrice;
      setAPY(apyInPercent);
    }
  }, [totalFarmers, totalInUSD]);

  const isSynced = () => {
    return tokens.length == prices.length && tokens.length == details.length;
  };

  const valueInUSD = (amount?: BigNumber, price?: number) => {
    if (!!amount && !!price) {
      return bigNumToFixed(amount) * price;
    } else {
      return 0;
    }
  };

  const earnAmount = () => {
    if (totalFarmers?.gt(0) && dispatchedFarmers?.gt(0)) {
      return dispatchedFarmers.mul(totalInUSD).div(totalFarmers).toNumber();
    } else {
      return 0;
    }
  };

  const dispatch = (epoch: number) => () => {
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    contracts.visionFarm
      .connect(signer)
      .dispatchFarmers(epoch)
      .then((tx) => {
        tx.wait().then((receipt) => {
          setLastTx(receipt.transactionHash);
        });
      })
      .catch((err) => alert(err));
  };

  const harvest = (epoch: number) => () => {
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    if (!tokensToHarvest || tokensToHarvest.length === 0) {
      alert("No token is selected for harvest.");
      return;
    }
    contracts.visionFarm
      .connect(signer)
      .harvest(epoch, tokensToHarvest)
      .then((tx) => {
        tx.wait().then((receipt) => {
          setLastTx(receipt.transactionHash);
        });
      })
      .catch((err) => alert(err));
  };

  const isChecked = (addr: string): boolean => {
    return (
      tokensToHarvest?.find((t) => getAddress(t) === getAddress(addr)) !==
      undefined
    );
  };

  return (
    <Card border={planting ? "success" : undefined}>
      <Card.Header>
        Farm #{epoch} - {planting ? "Planting" : "Farmed"}
      </Card.Header>
      <Card.Body>
        <Card.Title>
          APY
          <OverlayTooltip
            tip="Calculated with maximum lock period."
            children="❔"
          />
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>{apy?.toFixed(2)} %</Card.Text>
        <hr />
        <Card.Title>
          {planting ? "Planted crops" : "Harvestable crops"}
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>$ {totalInUSD}</Card.Text>
        {details.length > 0 && (
          <ListGroup className="list-group-flush">
            {details.length === tokens.length &&
              details.map((detail, i) => (
                <ListGroup.Item>
                  <Col>
                    <Form.Check
                      onChange={(_) => {
                        const _tokensToHarvest = isChecked(tokens[i])
                          ? tokensToHarvest?.filter(
                              (t) => getAddress(t) !== getAddress(tokens[i])
                            )
                          : [...(tokensToHarvest || []), tokens[i]];
                        setTokensToHarvest(_tokensToHarvest);
                      }}
                      checked={isChecked(tokens[i])}
                      label={`$${detail?.symbol}: ${formatEther(amounts[i])} ($
              ${
                (detail?.market_data.current_price.usd || 0) *
                bigNumToFixed(amounts[i])
              }
              )`}
                    />
                  </Col>
                </ListGroup.Item>
              ))}
          </ListGroup>
        )}
        <hr />
        <Card.Title>{planting ? "Expected earn" : "Earned"}</Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>$ {earnAmount()}</Card.Text>
        <Card.Text>
          {planting ? "Dispatchable" : "Dispatched"}:{" "}
          {formatEther(
            (planting ? dispatchableFarmers : dispatchedFarmers) || 0
          )}
        </Card.Text>
        {planting && (
          <Button variant="primary" onClick={dispatch(epoch)}>
            Dispatch
          </Button>
        )}
        {!planting && (
          <Button
            variant="primary"
            disabled={!dispatchedFarmers?.gt(0)}
            onClick={harvest(epoch)}
          >
            Harvest
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};
