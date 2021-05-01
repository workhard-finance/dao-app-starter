import React, { useState, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { BigNumber } from "@ethersproject/bignumber";
import { approveAndRun } from "../../../utils/utils";
import { ContractTransaction } from "ethers";
import { ProductView, ProductViewProps } from "./ProductView";
import { Product__factory } from "@workhard/protocol";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";

export interface ProductProps {
  address: string;
}

export const Product: React.FC<ProductProps> = ({ address }) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [product, setProduct] = useState<ProductViewProps>();
  const [approved, setApproved] = useState(false);
  const [approveTx, setApproveTx] = useState<ContractTransaction>();
  const [buyTx, setBuyTx] = useState<ContractTransaction>();

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const commitmentToken = contracts.commitmentToken;
      commitmentToken
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
      const product = Product__factory.connect(address, library);
      Promise.all([
        product.manufacturer(),
        product.name(),
        product.symbol(),
        product.description(),
        product.maxSupply(),
        product.totalSupply(),
        marketplace.products(address),
        product.baseURI(),
      ]).then(
        ([
          manufacturer,
          name,
          symbol,
          description,
          maxSupply,
          sold,
          info,
          uri,
        ]) => {
          const { profitRate, stock, price } = info;
          setProduct({
            address,
            manufacturer,
            name,
            symbol,
            description,
            maxSupply,
            sold,
            profitRate,
            stock,
            price,
            uri,
          });
        }
      );
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
      contracts.commitmentToken.address,
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
      .buy(address, amount)
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
      address={address}
      manufacturer={product?.manufacturer || "Fetching..."}
      name={product?.name || "Fetching..."}
      symbol={product?.symbol || "Fetching..."}
      description={product?.description || "Fetching..."}
      sold={product?.sold || BigNumber.from(0)}
      maxSupply={product?.maxSupply || BigNumber.from(0)}
      profitRate={product?.profitRate || BigNumber.from(0)}
      stock={product?.stock || BigNumber.from(0)}
      price={product?.price || BigNumber.from(0)}
      uri={
        product?.uri ||
        "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
      }
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
