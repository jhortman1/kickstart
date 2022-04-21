const path = require('path');

//solidity compiler
const solc = require('solc');

//Access to file system on computer extra functions from fs module
const fs = require('fs-extra');
const { deepStrictEqual } = require('assert');

//get path to the build folder
const buildPath = path.resolve(__dirname, 'build');

//delete the build folder
fs.removeSync(buildPath);

//get path to campaign.sol int he contracts folder
const campaignPath = path.resolve(__dirname, 'contracts', 'Campaign.sol');

//read in source code from that file - pass in campaign path and encoding of file (utf8)
const source = fs.readFileSync(campaignPath,'utf8');

//use solidity compiler to compile everything we pulled out of that file
const output = solc.compile(source, 1).contracts;

//insures that this file path exists, and if not create it
fs.ensureDirSync(buildPath);

//loop over the output object, take 
//each contract in it and write it to a differnt file in the build folder
console.log(output);
for (let contract in output) {
    fs.outputJSONSync(
        path.resolve(buildPath, contract.replace(':','') + '.json'),
        output[contract]
    );
}