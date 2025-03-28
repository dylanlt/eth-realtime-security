var Web3 = require("web3");
const web3 = new Web3(
  // "https://mainnet.infura.io/v3/71b09a7ce1124da1814f41c153370739"
  "https://rinkeby.infura.io/v3/71b09a7ce1124da1814f41c153370739"
);

let latestKnownBlockNumber = -1;
let blockTime = 5000;

var exec = require("child_process").exec;
function execShellCommand(cmd) {
  const exec = require("child_process").exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

// Our function that will triggered for every block
async function processBlock(blockNumber) {
  // console.log("We process block: " + blockNumber);
  let block = await web3.eth.getBlock(blockNumber);
  // console.log("new block :", block);
  for (const transactionHash of block.transactions) {
    console.log(transactionHash);
    
    
    // if (transactionHash!=='0xbfeae00823f8aa8fe23de93a4b8264d67b428262be2aaa6caf45361bfe541a4d') continue;
    
    
    let transaction = await web3.eth.getTransaction(transactionHash);
    // console.log(transaction);

    // let transactionReceipt = await web3.eth.getTransactionReceipt(
    //   transactionHash
    // );
    // console.log(transactionReceipt);

    if (!transaction.to) continue;
    const code = await web3.eth.getCode(transaction.to);


    // transaction = Object.assign(transaction, transactionReceipt);
    if (code) {
      console.log("Checking contract ", transaction.to);
      const res = await execShellCommand(`myth analyze -a ${transaction.to} --rpc infura-rinkeby --infura-id 71b09a7ce1124da1814f41c153370739 --max-depth 10 -o jsonv2`);
      const jsonRes = JSON.parse(res);
      const issuesFound = jsonRes[0].issues;
      console.log(`Found ${issuesFound.length} issues for ${transaction.to}`);
      if (issuesFound.length > 0) 
      for (const issue of issuesFound) {
        console.error(issue.description.head);
        console.log(issue.description.tail);
      }
    }
  }
  latestKnownBlockNumber = blockNumber;
}

// This function is called every blockTime, check the current block number and order the processing of the new block(s)
async function checkCurrentBlock() {
  const currentBlockNumber = await web3.eth.getBlockNumber();
  // console.log(
  //   "Current blockchain top: " + currentBlockNumber,
  //   " | Script is at: " + latestKnownBlockNumber
  // );
  while (
    latestKnownBlockNumber === -1 ||
    currentBlockNumber > latestKnownBlockNumber
  ) {
    await processBlock(
      latestKnownBlockNumber === -1
        ? currentBlockNumber
        : latestKnownBlockNumber + 1
    );
  }
  setTimeout(checkCurrentBlock, blockTime);
}

checkCurrentBlock();
