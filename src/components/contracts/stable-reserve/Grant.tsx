import React, { useEffect, useState } from "react";
import {
  BigNumber,
  BigNumberish,
  constants,
  PopulatedTransaction,
} from "ethers";
import { Form, Modal } from "react-bootstrap";
import { isAddress } from "@ethersproject/address";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import {
  defaultAbiCoder,
  formatEther,
  getAddress,
  parseEther,
} from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { getNetworkName, IERC20__factory } from "@workhard/protocol";
import { errorHandler, TxStatus } from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { useToasts } from "react-toast-notifications";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";

export interface GrantProps {
  projId: BigNumberish;
}

export const Grant: React.FC<GrantProps> = ({ projId }) => {
  const { account, chainId, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [amount, setAmount] = useState("0");
  const [allowance, setAllowance] = useState<BigNumber>();
  const [projectApproved, setProjectApproved] = useState(false);
  const [multisigOwner, setMultisigOwner] = useState<boolean>();
  const [mintable, setMintable] = useState<BigNumber>();
  const [show, setShow] = useState(false);
  const [popTx, setPopTx] = useState<PopulatedTransaction>();

  useEffect(() => {
    if (workhardCtx) {
      workhardCtx.dao.stableReserve
        .mintable()
        .then(setMintable)
        .catch(errorHandler(addToast));
    }
  }, [account, workhardCtx?.dao, blockNumber]);

  useEffect(() => {
    if (!!account && !!workhardCtx && !!chainId) {
      const network = getNetworkName(chainId);
      const { dao } = workhardCtx;
      const { multisig } = dao;
      if (multisig.address === account) {
        setMultisigOwner(true);
      } else {
        const gnosisAPI =
          network === "mainnet"
            ? `https://safe-transaction.gnosis.io/api/v1/`
            : network === "rinkeby"
            ? `https://safe-transaction.rinkeby.gnosis.io/api/v1/`
            : undefined;

        if (gnosisAPI) {
          fetch(gnosisAPI + `safes/${multisig.address}/`).then(
            async (response) => {
              const result = await response.json();
              if (
                (result.owners as string[])
                  .map(getAddress)
                  .includes(getAddress(account))
              ) {
                setMultisigOwner(true);
              }
            }
          );
        }
      }
    }
  }, [account, workhardCtx, chainId]);

  const grant = async () => {
    if (!account || !workhardCtx || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const stableReserve = workhardCtx.dao.stableReserve;
    const amountInWei = parseEther(amount);
    if (amountInWei.gt(mintable || 0)) {
      alert(`Not enough amount of ${workhardCtx.metadata.commitSymbol} tokens`);
      return;
    }
    const grantTx = await stableReserve
      .connect(signer)
      .populateTransaction.grant(
        workhardCtx.dao.contributionBoard.address,
        amountInWei,
        defaultAbiCoder.encode(["uint256"], [projId])
      );
    const timelockTx = await workhardCtx.dao.timelock.populateTransaction.schedule(
      stableReserve.address,
      grantTx.value || 0,
      grantTx.data || "0x",
      constants.HashZero,
      constants.HashZero,
      chainId === 1 ? 86400 * 1 : 60
    );
    setPopTx(timelockTx);
  };

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return (
    <div>
      <Form>
        <Form.Group>
          <Form.Label>
            Mintable - (balance:{" "}
            {mintable
              ? `${formatEther(mintable.toString())} ${
                  workhardCtx?.metadata.commitSymbol || `$COMMIT`
                }`
              : "?"}
            )
          </Form.Label>
          <Form.Control
            required
            type="text"
            onChange={({ target: { value } }) => setAmount(value)}
            value={amount}
          />
        </Form.Group>
        <ConditionalButton
          variant="outline"
          enabledWhen={multisigOwner}
          whyDisabled={`Only dev multisig or Workers Union can call this function.`}
          onClick={() => {
            grant().then(handleShow);
          }}
          children={"ABI Data"}
        />
      </Form>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Here's the custom data for gnosis safe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Address:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {popTx?.to}
          </code>
          <br />
          <br />
          <h5>Value:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {popTx?.value || 0}
          </code>
          <br />
          <br />
          <h5>Data:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {popTx?.data}
          </code>
        </Modal.Body>
      </Modal>
    </div>
  );
};
