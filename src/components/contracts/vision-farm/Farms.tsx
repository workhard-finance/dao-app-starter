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
import { Epoch } from "./Epoch";

export interface FarmsProps {}

export const Farms: React.FC<FarmsProps> = ({}) => {
  const { library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();

  const [visionPrice, setVisionPrice] = useState<number>();
  const [epoch, setCurrentEpoch] = useState<BigNumber>();

  useEffect(() => {
    if (!!contracts) {
      contracts.visionFarm.getCurrentEpoch().then(setCurrentEpoch);
      getPriceFromCoingecko(contracts.visionToken.address).then(setVisionPrice);
    }
  }, [contracts, blockNumber]);

  return (
    <>
      {epoch &&
        Array(epoch.toNumber() + 1)
          .fill(undefined)
          .map((_, i) => {
            return (
              <>
                <br />
                <Epoch
                  epoch={i + 1}
                  planting={epoch.eq(i)}
                  visionPrice={visionPrice || 0}
                />
              </>
            );
          })
          .reverse()}
    </>
  );
};
