import { useWeb3React } from "@web3-react/core";
import { providers } from "ethers";
import React, { useEffect, useState } from "react";
import { useContext } from "react";

const BlockNumberCtx = React.createContext<{ blockNumber?: number }>({
  blockNumber: undefined,
});

export function useBlockNumber() {
  const ctx = useContext(BlockNumberCtx);
  return ctx;
}

export const BlockNumberProvider = ({ children }: { children: any }) => {
  const { library } = useWeb3React<providers.Web3Provider>();
  const [blockNumber, setBlockNumber] = useState<number>();

  useEffect(() => {
    if (!!library) {
      library
        .getBlockNumber()
        .then((blockNumber: number) => {
          setBlockNumber(blockNumber);
        })
        .catch(() => {
          setBlockNumber(undefined);
        });

      const updateBlockNumber = (blockNumber: number) => {
        setBlockNumber(blockNumber);
      };
      library.on("block", updateBlockNumber);

      return () => {
        library.removeListener("block", updateBlockNumber);
      };
    }
  }, [library]);

  return (
    <BlockNumberCtx.Provider value={{ blockNumber }}>
      {children}
    </BlockNumberCtx.Provider>
  );
};
