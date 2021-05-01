import React, { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { getPriceFromCoingecko } from "../../../utils/coingecko";
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
              <div key={`farm-epoch-${i}`}>
                <br />
                <Epoch
                  epoch={i + 1}
                  planting={epoch.eq(i)}
                  visionPrice={visionPrice || 0}
                />
              </div>
            );
          })
          .reverse()}
    </>
  );
};
