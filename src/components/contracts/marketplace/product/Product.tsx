import React, { useState, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../../providers/WorkhardContractProvider";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { approveAndRun } from "../../../../utils/utils";
import { ContractTransaction } from "ethers";
import { ProductData, ProductView, ProductViewProps } from "./ProductView";
import { useBlockNumber } from "../../../../providers/BlockNumberProvider";

export interface ProductProps {
  tokenId: BigNumberish;
}

export const Product: React.FC<ProductProps> = ({ tokenId }) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [product, setProduct] = useState<ProductData>({
    manufacturer: "",
    totalSupply: BigNumber.from(0),
    maxSupply: BigNumber.from(0),
    price: BigNumber.from(0),
    profitRate: BigNumber.from(0),
    uri: "",
  });
  const [approved, setApproved] = useState(false);
  const [approveTx, setApproveTx] = useState<ContractTransaction>();
  const [buyTx, setBuyTx] = useState<ContractTransaction>();

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const commit = contracts.commit;
      commit
        .allowance(account, contracts.marketplace.address)
        .then((allowance) => {
          if (!stale) {
            if (allowance.gt(product?.price || 0)) setApproved(true);
            else setApproved(false);
          }
        });
    }
  }, [account, contracts, blockNumber]);
  useEffect(() => {
    if (!!account && !!library && !!contracts) {
      const marketplace = contracts.marketplace;
      marketplace.uri(tokenId).then((uri) => {
        marketplace.products(tokenId).then((_product) => {
          setProduct(_product);
        });
      });
    }
  }, [account, contracts, buyTx]);
  const approveAndBuy = (amount: number) => {
    if (!account || !contracts || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    approveAndRun(
      signer,
      contracts.stableReserve.address,
      contracts.marketplace.address,
      setApproveTx,
      setApproved,
      buy(amount)
    );
  };

  const buy = (amount: number) => () => {
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
      });
  };
  return (
    <ProductView
      product={product}
      onClick={(amount) => {
        if (approved) {
          buy(amount)();
        } else {
          approveAndBuy(amount);
        }
      }}
      buttonText={
        approveTx
          ? "Approving..."
          : approved
          ? buyTx
            ? "Buying..."
            : "Buy"
          : "Approve"
      }
    />
  );
};
