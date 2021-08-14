import { MiningPool__factory } from "@workhard/protocol";
import { UniswapV2Pair__factory } from "@workhard/protocol/dist/build/@uniswap";
import { BigNumber } from "ethers";
import { isAddress } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { PoolType, PoolTypeHash } from "../../utils/ERC165Interfaces";
import {
  errorHandler,
  getTokenLogo,
  getTokenSymbol,
  getTokenType,
  TokenType,
} from "../../utils/utils";
import { ERC20BurnMiningV1 } from "../contracts/mining-pool/ERC20BurnMiningV1";
import { ERC20StakeMiningV1 } from "../contracts/mining-pool/ERC20StakeMiningV1";

export interface MiningPoolProps {
  poolAddress: string;
  poolIdx: number;
  title?: string;
  tokenSymbol?: string;
  totalEmission: BigNumber;
  apy: number;
  emissionWeightSum: BigNumber;
  description?: string;
  collapsible?: boolean;
  link?: string;
}

export const MiningPool: React.FC<MiningPoolProps> = (props) => {
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  const [poolType, setPoolType] = useState<PoolTypeHash>();
  const [baseToken, setBaseToken] = useState<string>();
  const [tokenType, setTokenType] = useState<TokenType>();
  const [tokenSymbol, setTokenSymbol] = useState<string | undefined>(
    props.tokenSymbol
  );
  const [logos, setLogos] = useState<string[]>();

  useEffect(() => {
    if (workhardCtx) {
      workhardCtx.dao.visionEmitter
        .poolTypes(props.poolAddress)
        .then((sigHash) => setPoolType(sigHash as PoolTypeHash))
        .catch(errorHandler(addToast));
      MiningPool__factory.connect(props.poolAddress, workhardCtx.web3.library)
        .baseToken()
        .then(setBaseToken)
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx]);

  useEffect(() => {
    if (baseToken && isAddress(baseToken) && workhardCtx) {
      getTokenType(baseToken, workhardCtx.web3.library)
        .then(setTokenType)
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, baseToken]);

  useEffect(() => {
    if (workhardCtx && baseToken && tokenType) {
      getTokenSymbol(baseToken, tokenType, workhardCtx.web3.library)
        .then(setTokenSymbol)
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, baseToken, tokenType]);

  useEffect(() => {
    if (workhardCtx && baseToken) {
      if (tokenSymbol === "UNI-V2") {
        Promise.all([
          UniswapV2Pair__factory.connect(
            baseToken,
            workhardCtx.web3.library
          ).token0(),
          UniswapV2Pair__factory.connect(
            baseToken,
            workhardCtx.web3.library
          ).token1(),
        ]).then(([token0, token1]) => {
          setLogos([token0, token1].map(getTokenLogo));
        });
      } else {
        setLogos([getTokenLogo(baseToken)]);
      }
    }
  }, [workhardCtx, tokenSymbol]);
  if (poolType === PoolType.ERC20BurnV1) {
    return (
      <ERC20BurnMiningV1
        poolIdx={props.poolIdx}
        title={props.title || `Burn ${tokenSymbol || baseToken}`}
        tokenName={tokenSymbol || baseToken}
        poolAddress={props.poolAddress}
        totalEmission={props.totalEmission}
        emissionWeightSum={props.emissionWeightSum}
        apy={props.apy || 0}
        collapsible={props.collapsible}
        logos={logos}
      />
    );
  } else if (poolType === PoolType.ERC20StakeV1) {
    return (
      <ERC20StakeMiningV1
        poolIdx={props.poolIdx}
        title={props.title || `Stake ${tokenSymbol || baseToken}`}
        tokenName={tokenSymbol || baseToken}
        poolAddress={props.poolAddress}
        totalEmission={props.totalEmission}
        emissionWeightSum={props.emissionWeightSum}
        apy={props.apy || 0}
        collapsible={props.collapsible}
        logos={logos}
      />
    );
  } else if (poolType === undefined) {
    return (
      <Card>
        <Card.Body>
          <p>Fetching...</p>
        </Card.Body>
      </Card>
    );
  } else {
    return (
      <Card>
        <Card.Body>
          <p>Unsupported pool type. Please Make a PR!</p>
        </Card.Body>
      </Card>
    );
  }
};
