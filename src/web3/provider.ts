import { providers } from "ethers";
export const getLibrary = (

  provider: providers.ExternalProvider | providers.JsonRpcFetchFunc,
  _: any
) => {
  const library = new providers.Web3Provider(provider); // this will vary according to whether you use e.g. ethers or web3.js
  library.pollingInterval = 12000;
};
