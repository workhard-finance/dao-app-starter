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
  const [creating, setCreating] = useState<boolean>();

  useEffect(() => {
    if (!ipfs && !creating) {
      setCreating(true);
      create()
        .then((ipfs) => {
          setIPFS(ipfs);
          setCreating(false);
        })
        .catch((err) => {
          console.error(err);
          setCreating(false);
        });
    }
  }, [ipfs, creating]);

  return <IPFSCtx.Provider value={{ ipfs }}>{children}</IPFSCtx.Provider>;
};
