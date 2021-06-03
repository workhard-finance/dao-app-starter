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
    console.log("init");
    if (!ipfs) {
      create()
        .then((ipfs) => {
          setIPFS(ipfs);
        })
        .catch((err) => {
          console.error(err);
        });
    }
    return () => {
      if (ipfs && ipfs.stop) {
        console.log("Stopping IPFS");
        ipfs.stop().catch((err) => console.error(err));
        setIPFS(undefined);
      }
    };
  }, [ipfs]);

  return <IPFSCtx.Provider value={{ ipfs }}>{children}</IPFSCtx.Provider>;
};
