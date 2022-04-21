const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../ethereum/build/CampaignFactory.json');
const compiledCampaign = require('../ethereum/build/Campaign.json');
const { isRegExp } = require('util/types');

let accounts;
let factory;
let campaignAddress;
let campaign;

//get list of accounts
//deploy instance of factory contract - using contract constructor(apart of web3 library)
//then pass in conmpiled factory abi
//deploy and send out to the network
beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    //creates the idea of thecontract in web3
    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    //chain on .deploy - recieves byte code needed to deploy to the network
    .deploy({ data: compiledFactory.bytecode })
    .send({from: accounts[0], gas: '1000000'});

    //create one campaign instance to be avaliable in eact test
    await factory.methods.createCampaign('100').send({
        from: accounts[0],
        gas: '1000000'
    });
    // take the first element of the array 
    //that is passed back from tha call and set it to the variable
    [campaignAddress] = await factory.methods.getDeployedCampaigns().call();
    campaign = await new web3.eth.Contract(
        JSON.parse(compiledCampaign.interface),
        campaignAddress
    );
});

describe('Campaigns', () => {
    it('deploys a factory and campaign contract', () => {
        assert.ok(factory.options.address);
        assert.ok(campaign.options.address);
    });

    it('marks caller as the campaign manager', async () => {
        const manager = await campaign.methods.manager().call();
        assert.equal(accounts[0],manager);
    });

    it('allows people to contribute money and marks as approver', async () => {
        await campaign.methods.contribute().send({
            value: '200',
            from: accounts[1]
        });
        const isContributor = await campaign.methods.approvers(accounts[1]).call();
        assert(isContributor);
    });

    it('requires a minimum contribution', async () => {
        try{
            await campaign.methods.contribute().send({
                value: '1',
                from: accounts[1]
            });
            assert(false);
        } catch (err){
            assert(err);
        }
    });

    it('allows a manager to make a payment request', async () => {
        await campaign.methods
        .createRequest('Buy Batteries', '100', accounts[1])
        .send({
            from: accounts[0],
            gas: '1000000'
        });
        const request = await campaign.methods.requests(0).call();
        assert.equal('Buy Batteries', request.description);
    });

    it('processes request', async () => {
        await campaign.methods.contribute().send({
            from: accounts[0],
            value: web3.utils.toWei('10','ether')
        });

        await campaign.methods
        .createRequest('Buy Stuff', web3.utils.toWei('5','ether'), accounts[1])
        .send({
            from: accounts[0],
            gas: '1000000'
        });

        await campaign.methods.approveRequest(0)
        .send({
            from: accounts[0],
            gas: '1000000'
        });

        await campaign.methods.finalizeRequest(0)
        .send({
            from: accounts[0],
            gas: '1000000'
        });

        let balance = await web3.eth.getBalance(accounts[1]);
        balance = web3.utils.fromWei(balance, 'ether');
        balance = parseFloat(balance);

        assert(balance > 104);
    });
});