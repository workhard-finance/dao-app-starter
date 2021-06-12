import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { UnsupportedChainIdError, useWeb3React } from "@web3-react/core";
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from "@web3-react/injected-connector";
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from "@web3-react/walletconnect-connector";
import { ethers, providers } from "ethers";
import { Spinner } from "./Spinner";
import { useInactiveListener } from "../hooks/InactivListener";
import { useEagerConnect } from "../hooks/EagerConnect";
import { AbstractConnector } from "@web3-react/abstract-connector";
import {
  injected,
  ledger,
  network,
  trezor,
  walletconnect,
  walletlink,
} from "../web3/connectors";
import { useWorkhard } from "../providers/WorkhardProvider";
import { useStores } from "../hooks/user-stores";

function getErrorMessage(error: Error) {
  if (error instanceof NoEthereumProviderError) {
    return "No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.";
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network.";
  } else if (
    error instanceof UserRejectedRequestErrorInjected ||
    error instanceof UserRejectedRequestErrorWalletConnect
  ) {
    return "Please authorize this website to access your Ethereum account.";
  } else {
    console.error(error);
    return "An unknown error occurred. Check the console for more details.";
  }
}

const Wallet = (props: React.ComponentProps<any>) => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const { userStore } = useStores();

  enum ConnectorNames {
    Injected = "Metamask",
    Network = "JSON-RPC",
    WalletConnect = "WalletConnect",
    WalletLink = "WalletLink",
    Ledger = "Ledger",
    Trezor = "Trezor",
    // Lattice = "Lattice",
    // Frame = "Frame",
    // Authereum = "Authereum",
    // Fortmatic = "Fortmatic",
    // Magic = "Magic",
    // Portis = "Portis",
    // Torus = "Torus",
  }

  const connectorsByName: {
    [connectorName in ConnectorNames]: AbstractConnector;
  } = {
    [ConnectorNames.Injected]: injected,
    [ConnectorNames.Network]: network,
    [ConnectorNames.WalletConnect]: walletconnect,
    [ConnectorNames.WalletLink]: walletlink,
    [ConnectorNames.Ledger]: ledger,
    [ConnectorNames.Trezor]: trezor,
    // [ConnectorNames.Lattice]: lattice,
    // [ConnectorNames.Frame]: frame,
    // [ConnectorNames.Authereum]: authereum,
    // [ConnectorNames.Fortmatic]: fortmatic,
    // [ConnectorNames.Magic]: magic,
    // [ConnectorNames.Portis]: portis,
    // [ConnectorNames.Torus]: torus,
  };
  const context = useWeb3React<providers.Web3Provider>();
  const {
    connector,
    account,
    activate,
    deactivate,
    active,
    error,
    library,
  } = context;
  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState<any>();
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect();
  const ctx = useWorkhard();

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector);

  // register default assets.
  // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-747.md for metamask
  try {
    if (!userStore.tokenAdded && library?.provider.isMetaMask) {
      const TOKENS = [
        {
          address: ctx?.dao.vision.address,
          symbol: "VISION",
          decimals: 18,
          // todo: add
          image: "",
        },
        {
          address: ctx?.dao.commit.address,
          symbol: "COMMIT",
          decimals: 18,
          // todo: add
          image: "",
        },
      ];
      TOKENS.forEach((token) => {
        // @ts-ignore
        library.provider.send(
          {
            method: "wallet_watchAsset",
            params: {
              // Initially only supports ERC20, but eventually more!
              // @ts-ignore
              type: "ERC20",
              options: {
                address: token.address, // The address that the token is at.
                symbol: token.symbol, // A ticker symbol or shorthand, up to 5 chars.
                decimals: token.decimals, // The number of decimals in the token
                image: "http", // A string url of the token logo
              },
            },
          },
          (error, response) => {
            console.log(response);
          }
        );
      });
      userStore.setTokenAdded(true);
    }
  } catch (e) {}
  return (
    <div {...props}>
      <Button
        variant={active ? "outline-success" : "success"}
        onClick={active ? handleShow : handleShow}
      >
        {active ? `${account?.slice(0, 6)}...${account?.slice(-4)}` : "Connect"}
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Choose wallet to connect</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ display: "flex", flexDirection: "column" }}>
          {Object.keys(connectorsByName).map((name) => {
            const currentConnector: AbstractConnector =
              connectorsByName[name as ConnectorNames];
            const activating = currentConnector === activatingConnector;
            const connected = currentConnector === connector;
            const disabled =
              !triedEager || !!activatingConnector || connected || !!error;

            return (
              <Button
                variant={connected ? "outline-success" : "outline-primary"}
                style={{
                  // height: "3rem",
                  // borderRadius: "1rem",
                  margin: "0.5rem",
                  // borderColor: activating
                  //   ? "orange"
                  //   : connected
                  //   ? "green"
                  //   : "unset",
                  // cursor: disabled ? "unset" : "pointer",
                  // position: "relative",
                }}
                disabled={disabled}
                key={name}
                onClick={() => {
                  setActivatingConnector(currentConnector);
                  activate(connectorsByName[name as ConnectorNames]);
                }}
              >
                {activating && (
                  <Spinner
                    color={"black"}
                    style={{ height: "25%", marginLeft: "-1rem" }}
                  />
                )}
                {name}
              </Button>
            );
          })}
        </Modal.Body>
        <Modal.Footer>
          {(active || error) && (
            <Button
              variant="danger"
              onClick={() => {
                deactivate();
              }}
            >
              Deactivate
            </Button>
          )}

          {!!error && (
            <h4 style={{ marginTop: "1rem", marginBottom: "0" }}>
              {getErrorMessage(error)}
            </h4>
          )}
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Wallet;
