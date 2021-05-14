import React, { useState, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../../providers/WorkhardContractProvider";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import {
  errorHandler,
  handleTransaction,
  isApproved,
  TxStatus,
} from "../../../../utils/utils";
import { constants, ContractTransaction } from "ethers";
import { ProductData, ProductView } from "./ProductView";
import { useBlockNumber } from "../../../../providers/BlockNumberProvider";
import { useIPFS } from "../../../../providers/IPFSProvider";
import { IPFS } from "ipfs-core/src";
import { useToasts } from "react-toast-notifications";

export interface ProductProps {
  tokenId: BigNumberish;
  uri?: string;
}

export const Product: React.FC<ProductProps> = ({ tokenId, uri }) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const { addToast } = useToasts();
  const [product, setProduct] = useState<ProductData>({
    manufacturer: account || "",
    price: BigNumber.from(0),
    profitRate: BigNumber.from(0),
    totalSupply: BigNumber.from(0),
    maxSupply: BigNumber.from(0),
    uri: "",
  });
  const [allowance, setAllowance] = useState<BigNumber>();
  const [approveTxStatus, setApproveTxStatus] = useState<TxStatus>();
  const [approveTx, setApproveTx] = useState<ContractTransaction>();
  const [buyTx, setBuyTx] = useState<ContractTransaction>();
  const [amount, setAmount] = useState<number>();

  useEffect(() => {
    if (!!account && !!contracts) {
      const commit = contracts.commit;
      commit
        .allowance(account, contracts.marketplace.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
      contracts.marketplace
        .products(tokenId)
        .then(setProduct)
        .catch(errorHandler(addToast));
    }
  }, [account, contracts, blockNumber]);

  const approveAndBuy = () => {
    if (!account || !contracts || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      contracts.commit
        .connect(signer)
        .approve(contracts.marketplace.address, constants.MaxUint256),
      setApproveTxStatus,
      addToast,
      "Approved Marketplace",
      buy
    );
  };

  const buy = () => {
    if (!account || !contracts || !library) {
      alert("Not connected");
      return;
    }
    if (!amount || amount == 0) {
      alert("Cannot buy 0");
      return;
    }
    const signer = library.getSigner(account);
    const marketplace = contracts.marketplace;
    marketplace
      .connect(signer)
      .buy(tokenId, account, amount)
      .then((tx) => {
        setBuyTx(tx);
        tx.wait()
          .then((_receipt) => {
            setBuyTx(undefined);
          })
          .catch((rejected) => {
            setBuyTx(undefined);
            alert(`rejected: ${rejected}`);
          });
      })
      .catch((rejected) => {
        setBuyTx(undefined);
        alert(`rejected: ${rejected}`);
      });
  };
  return (
    <ProductView
      product={product}
      onAmountChange={setAmount}
      onClick={() => {
        if (isApproved(allowance, product.price.mul(amount || 0))) {
          buy();
        } else {
          approveAndBuy();
        }
      }}
      buttonText={
        approveTx
          ? "Approving..."
          : isApproved(allowance, product.price.mul(amount || 0))
          ? buyTx
            ? "Buying..."
            : "Buy"
          : "Approve"
      }
    />
  );
};
