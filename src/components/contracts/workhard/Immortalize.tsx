import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumberish, providers, ethers, constants, BigNumber } from "ethers";
import { Form } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { getAddress, randomBytes } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import {
  compareAddress,
  errorHandler,
  getGnosisAPI,
  safeTxHandler,
  TxStatus,
} from "../../../utils/utils";
import { useToasts } from "react-toast-notifications";

export interface Immortalize {}

export const Immortalize: React.FC<Immortalize> = ({}) => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [hasPermission, setHasPermission] = useState<boolean>();

  useEffect(() => {
    if (!!workhardCtx && !!account && !!chainId) {
      const gnosisAPI = getGnosisAPI(chainId);
      if (gnosisAPI) {
        fetch(gnosisAPI + `safes/${workhardCtx.dao.multisig.address}/`)
          .then(async (response) => {
            const result = await response.json();
            if (
              (result.owners as string[])
                .map(getAddress)
                .includes(getAddress(account))
            ) {
              setHasPermission(true);
            }
          })
          .catch((_) => {
            setHasPermission(false);
          });
      }
    }
  }, [workhardCtx, account, chainId]);

  const handleSubmit: FormEventHandler = async (event) => {
    if (!workhardCtx || !chainId || !library || !account) {
      alert("Not connected.");
      return;
    }

    const signer = library.getSigner(account);
    const { workhard } = workhardCtx;
    const tx = await workhard.populateTransaction.immortalize(
      workhardCtx.daoId
    );
    if (!tx.data) {
      alert("Failed to created tx");
      return;
    }
    const popScheduledTx = await workhardCtx.dao.timelock.populateTransaction.schedule(
      workhardCtx.workhard.address,
      0,
      tx.data,
      constants.HashZero,
      BigNumber.from(randomBytes(32)).toHexString(),
      await workhardCtx.dao.timelock.getMinDelay()
    );
    safeTxHandler(
      chainId,
      workhardCtx.dao.multisig.address,
      popScheduledTx,
      signer,
      setTxStatus,
      addToast,
      "Immortalized successfully!",
      (receipt) => {
        if (receipt) {
        } else {
          alert("Created Multisig Tx. Go to Gnosis wallet and confirm.");
        }
        setTxStatus(undefined);
      }
    );
  };
  return (
    <Form onSubmit={handleSubmit}>
      <ConditionalButton
        variant="danger"
        type="submit"
        enabledWhen={hasPermission}
        whyDisabled={`Only owner or multisig can call this function.`}
        tooltip={"Create a multisig transaction"}
        children={`Immortalize`}
      />
    </Form>
  );
};
