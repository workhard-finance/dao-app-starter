## Front-env v1

Based on
1. Create-React-App
2. Typechain
3. Ethers-v5
4. react-bootstrap
5. web3-react
6. bootswatch - where the design came from


## Run local node for frontend dev

1. Clone protocol and run hardhat node

    ```
    $ git clone https://github.com/workhard-finance/protocol
    $ cd protocol
    $ yarn hardhat node --network localhost
    ```

2. Open a new terminal and deploy fixtures on the local node

    ```
    yarn deploy:localhost
    ```

    This will update or generate `deployed.dev.json` file
  
3. Make sure that you've compiled the typescript artifacts correctly.
    ```
    yarn compile # this automatically generates typed contracts using typechain
    ```

4. Go to its parent directory and clone frontenv-v1 repository. Then, add the local dependency.
  
    ```
    $ cd ../ 
    $ git clone https://github.com/workhard-finance/frontend-v1
    $ yarn # install dependencies
    $ yarn add ../protocol
    $ yarn start
    ```
    * you may want to use `yarn link` or `npm link` but that will break ts-loader setting of this CRA webpack setting.

5. Open a browser and import default hardhat testing metamask key. Recommend to you a separate chrome or firefox profile to manage new metamask keys.
    ```
    test test test test test test test test test test test junk
    ```
  
6. Go to metamask setup and add your local network to metamask with network id 31337. Usually you may change the network id of localhost:8545 from 1337 to 31337
7. Enjoy UI testing.

