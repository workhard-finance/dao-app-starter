import React, { useEffect, useState } from "react";
import { BigNumber, BigNumberish, providers } from "ethers";
import { Form, ProgressBar } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import {
  errorHandler,
  getVariantForProgressBar,
  handleTransaction,
  TxStatus,
} from "../../../utils/utils";
import { useToasts } from "react-toast-notifications";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { formatEther } from "ethers/lib/utils";

export interface StreamProps {
  streamId: BigNumberish;
}

export const Stream: React.FC<StreamProps> = ({ streamId }) => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [timestamp, setTimestamp] = useState<number>();
  const [stream, setStream] = useState<{
    sender: string;
    recipient: string;
    deposit: BigNumber;
    token: string;
    startTime: BigNumber;
    stopTime: BigNumber;
    remainingBalance: BigNumber;
    ratePerSecond: BigNumber;
  }>();

  useEffect(() => {
    if (!!account && !!library && !!streamId && !!workhardCtx) {
      const sablier = workhardCtx.commons.sablier;
      sablier.getStream(streamId).then(setStream).catch(errorHandler(addToast));
      library.getBlock("latest").then((block) => setTimestamp(block.timestamp));
    }
  }, [txStatus, blockNumber]);

  const withdraw = async () => {
    if (!account || !workhardCtx || !library) {
      alert("Not connected");
      return;
    }
    const withdrawable = getWithdrawable();
    if (!withdrawable) {
      alert("Oops, there's nothing to withdraw.");
      return;
    }
    const sablier = workhardCtx.commons.sablier;
    const signer = library.getSigner(account);

    handleTransaction(
      sablier.connect(signer).withdrawFromStream(streamId, withdrawable),
      setTxStatus,
      addToast,
      `Successfully withdrew ${workhardCtx.metadata.commitSymbol}!`
    );
  };

  const getUnlocked = (): BigNumber | undefined => {
    if (!stream) return undefined;
    if (!library) return undefined;
    if (!timestamp) return undefined;
    if (stream.stopTime.lte(timestamp)) return stream.deposit;
    const unlocked = stream.ratePerSecond.mul(
      timestamp - stream.startTime.toNumber()
    );
    return unlocked;
  };

  const getWithdrawable = (): BigNumber | undefined => {
    if (!stream) return undefined;
    const unlocked = getUnlocked();
    const withdrawn = stream.deposit.sub(stream.remainingBalance);
    return unlocked?.sub(withdrawn);
  };

  const getProgress = (): number => {
    if (!stream) return 0;
    if (!timestamp) return 0;
    const stopTime = stream.stopTime.toNumber();
    const startTime = stream.startTime.toNumber();
    const progressed = Math.min(stopTime, timestamp) - startTime;
    return (100 * progressed) / (stopTime - startTime);
  };

  const toFix3 = (val?: BigNumber): string => {
    if (!val) return `0`;
    return parseFloat(formatEther(val)).toFixed(3);
  };

  return (
    <Form>
      <Form.Group>
        <p>
          <a
            href={`https://app.sablier.finance/stream/${BigNumber.from(
              streamId
            ).toNumber()}`}
            target="_blank"
          >
            Stream ID: {streamId}
          </a>
          <br />
          To:{" "}
          <a
            href={`https://etherscan.com/address/${stream?.recipient}`}
            target="_blank"
          >
            {stream?.recipient.slice(0, 6)}...{stream?.recipient.slice(-4)}
          </a>
          <br />
          Total: {toFix3(stream?.deposit)}
          <br />
          Remaining: {toFix3(stream?.remainingBalance)}
          <br />
          Withdrawn:{" "}
          {stream ? toFix3(stream.deposit.sub(stream.remainingBalance)) : 0}
        </p>

        <ProgressBar
          variant={getVariantForProgressBar(getProgress())}
          animated
          now={getProgress()}
        />
        {stream && timestamp && (
          <Form.Text>
            {(
              Math.min(
                BigNumber.from(timestamp).sub(stream.startTime).toNumber(),
                stream.stopTime.sub(stream.startTime).toNumber()
              ) / 86400
            ).toFixed(1)}{" "}
            /{" "}
            {(stream.stopTime.sub(stream.startTime).toNumber() / 86400).toFixed(
              1
            )}{" "}
            day(s)
          </Form.Text>
        )}
      </Form.Group>
      <ConditionalButton
        enabledWhen={account === stream?.recipient}
        whyDisabled={`Only the recipient can call this.`}
        onClick={withdraw}
      >
        Withdraw: {parseFloat(formatEther(getWithdrawable() || 0)).toFixed(2)}{" "}
        {workhardCtx?.metadata.commitSymbol || `$COMMIT`}
      </ConditionalButton>
    </Form>
  );
};
