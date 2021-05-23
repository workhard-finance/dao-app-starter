import React, { useState, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhard } from "../../../../providers/WorkhardProvider";
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
import { useToasts } from "react-toast-notifications";

export interface ProductProps {
  tokenId: BigNumberish;
  uri?: string;
}

export const Product: React.FC<ProductProps> = ({ tokenId, uri }) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { dao } = useWorkhard() || {};
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
    if (!!account && !!dao) {
      const commit = dao.commit;
      commit
        .allowance(account, dao.marketplace.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
      dao.marketplace
        .products(tokenId)
        .then(setProduct)
        .catch(errorHandler(addToast));
    }
  }, [account, dao, blockNumber, approveTx]);

  const approveAndBuy = () => {
    if (!account || !dao || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      dao.commit
        .connect(signer)
        .approve(dao.marketplace.address, constants.MaxUint256),
      setApproveTxStatus,
      addToast,
      "Approved Marketplace",
      buy
    );
  };

  const buy = () => {
    if (!account || !dao || !library) {
      alert("Not connected");
      return;
    }
    if (!amount || amount == 0) {
      alert("Cannot buy 0");
      return;
    }
    const signer = library.getSigner(account);
    const marketplace = dao.marketplace;
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
