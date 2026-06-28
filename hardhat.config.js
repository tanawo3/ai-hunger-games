require("@nomicfoundation/hardhat-toolbox");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    ritual: {
      url: "https://rpc.ritualfoundation.org",
      chainId: 1979,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      ritual: "abc" // Blockscout doesn't require a real API key
    },
    customChains: [
      {
        network: "ritual",
        chainId: 1979,
        urls: {
          apiURL: "https://explorer.ritualfoundation.org/api",
          browserURL: "https://explorer.ritualfoundation.org"
        }
      }
    ]
  },
  sourcify: {
    enabled: true
  }
};
