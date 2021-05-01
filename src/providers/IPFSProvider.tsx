import { useWeb3React } from "@web3-react/core";
import { providers } from "ethers";
import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { create, IPFS } from "ipfs-core";

const IPFSCtx = React.createContext<{ ipfs?: IPFS }>({
  ipfs: undefined,
});

export function useIPFS() {
  const ctx = useContext(IPFSCtx);
  return ctx;
}

export const IPFSProvider = ({ children }: { children: any }) => {
  const [ipfs, setIPFS] = useState<IPFS>();

  useEffect(() => {
    if (!ipfs) {
      console.log("ipfs create");
      create()
        .then((ipfs) => {
          setIPFS(ipfs);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [ipfs]);

  return <IPFSCtx.Provider value={{ ipfs }}>{children}</IPFSCtx.Provider>;
};
