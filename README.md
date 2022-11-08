# Armory Collection Smart Contract

## Setup

- Install required packages

  ```
  npm install
  ```

- Grab a copy of the [Massless Smart Contract Library](https://gitlab.com/massless.io/smart-contract-library)
  - In the smart-contract-library root (on your local system) (may need elevated user permissions)
    ```
    npm link
    ```
  - In this Armory Collection Smart Contract root (smart-contract)
    ```
    npm link @massless.io/smart-contract-library
    ```
- Setup the environment

  ```
  cp .env.example .env
  ```

- Compile

  ```
  npm run compile
  ```

  > May need to restart VS Code for it to register the typechain files.

- On VSCode extension store library [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter).

> You must restart VSCode after installing Mocha Test Explorer.

## Testing

A lab flask icon will appear in the left most toolbar. From here you can run or debug the relevant test.

You can also get more information like gas fees and code coverage from running the test in the terminal.

- Test (optimized)
  ```
  npm run test
  ```
- Test (un-optimized)
  ```
  npm run testDebug
  ```
- Coverage
  ```
  npm run coverage
  ```

> Coverage will complain that the contract size is too big, ignore the message as this only relates to the coverage checker.

## Compile

If you only require the compiled code (ABI and/or ByteCode) you can stand-alone compile.

```
npm run compile
```

The solidity compiled `.json` file will be available at `/artifacts/contracts/{ContractFilename}/{ContractName}.json`. This file includes the ABI and the ByteCode.

## Proper gas cost testing

This is a gross method that priority was speed. You are welcome to improve the gasCost calculation method.

- rename the folder `test` to `testBackup`
- rename the folder `gasCostCalcTests` to `test`
- calculate costs
  ```
  npm run gasCost
  ```

When you are finished

- rename the folder `test` to `gasCostCalcTests`
- rename the folder `testBackup` to `test`

## Remix

This can be used with the Remix IDE

Ensure you install remixd is globally, you'll need to restart your terminal for remixd available on `path`.

```
npm install -g @remix-project/remixd@0.5.2
```

> 0.5.3 throws an error

- Launch remixd
  ```
  npm run remixd
  ```
- Navigate to: [remix.ethereum.org](https://remix.ethereum.org/)
- Start the local connection by clicking the `Workspaces Dropdown` and selecting `- connect to localhost -`

## Deployment

For any project the deployment scripts are: /smart-contract/scripts/deployNETWORK.ts where NETWORK is the blockchain that the script will be deployed to.
The deployment script will need updating based on the constructor arguments of the smart contract to be deployed.
To get you started deploy the contract locally: npx hardhat run scripts/deployLocal.ts —network localhost
Once a contract is ready for testnet deployment you want to obscure the name. There is a tool in the same scripts folder called encodeFilename.ts. npx ts-node scripts/encodeFilename.ts FILENAME where FILENAME is the name of the contract. eg ArmoryCollection.sol
When deploying to testnet we make a copy of the file, change the name (including the token name inside the .sol file.)

Steps which were followed

1. Run `npx hardhat run scripts/deployLocal.ts`
2. obscure the name by renaming the typechain/ArmoryCollection.d.ts to typechain/OKJILMPC3.d.ts and also correct the file contents (3 places)
3. also copy `contracts/ArmoryCollection.sol` `contracts/testnet/ArmoryCollection.sol`
4. rename contract name in `reDeployRinkeby.ts`
5. run `npx hardhat run scripts/reDeployRinkeby.ts --network rinkeby`
