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

export interface EpochProps {
  epoch: number;
  farming: boolean;
  visionPrice: number;
}

export const Epoch: React.FC<EpochProps> = ({
  epoch,
  farming,
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
  const [totalFarmers, setTotalFarmers] = useState<BigNumber>();
  const [totalInUSD, setTotalInUSD] = useState<number>(0);
  const [lastTx, setLastTx] = useState<string>();

  useEffect(() => {
    if (!!contracts && !!account) {
      contracts.visionFarm.getHarvestableCrops(epoch).then((res) => {
        setTokens(res.tokens);
        setAmounts(res.amounts);
      });
      contracts.visionFarm
        .dispatchedFarmers(account, epoch)
        .then(setDispatchedFarmers);
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
  }, [tokens]);

  useEffect(() => {
    if (tokens.length === amounts.length && tokens.length === prices.length) {
      const sum = amounts.reduce((acc, curr, i) => {
        return acc + parseFloat(formatEther(curr)) * (prices[i] || 0);
      }, 0);
      setTotalInUSD(sum);
    }
  }, [amounts, prices]);

  useEffect(() => {
    const maxLock = 200;
    if (!totalFarmers || totalFarmers.eq(0)) {
      setAPY(Infinity);
    } else {
      const earnPerFarmer = totalInUSD / parseFloat(formatEther(totalFarmers));
      const earnPerVisionWithMaxLock = earnPerFarmer * maxLock;
      const yearlyEarnPerVisionWithMaxLock = earnPerVisionWithMaxLock * 12;
      const apyInPercent = (yearlyEarnPerVisionWithMaxLock * 100) / visionPrice;
      setAPY(apyInPercent);
    }
  }, [totalFarmers, totalInUSD]);

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

  const earned = () => {
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
    contracts.visionFarm
      .connect(signer)
      .harvestAll(epoch)
      .then((tx) => {
        tx.wait().then((receipt) => {
          setLastTx(receipt.transactionHash);
        });
      })
      .catch((err) => alert(err));
  };

  return (
    <Card border={farming ? "success" : undefined}>
      <Card.Header>
        Farm #{epoch} - {farming ? "Farming" : "Farmed"}
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
        <Card.Title>Crops</Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>$ 43211</Card.Text>
        <ListGroup className="list-group-flush">
          <ListGroup.Item>$DAI: 1000 ($1000)</ListGroup.Item>
          <ListGroup.Item>$COMMITMENT: 34120 ($51323)</ListGroup.Item>
          <ListGroup.Item>$VISION: 340 ($91339)</ListGroup.Item>
        </ListGroup>
        <hr />
        <Card.Title>Earned</Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>$ {earned()}</Card.Text>
        <Button
          variant="primary"
          onClick={farming ? dispatch(epoch) : harvest(epoch)}
        >
          {farming ? "Dispatch" : "Harvest"}
        </Button>
      </Card.Body>
    </Card>
  );
};
