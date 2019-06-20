'use strict';
const util = require('util');
const helper = require('./helper.js');
const logger = helper.getLogger('instantiate-chaincode');

const instantiateChaincode = async function(peers, channelName, chaincodeName, chaincodeVersion, functionName, chaincodeType, args, username, org_name) {
	logger.debug('\n\n============ Instantiate chaincode on channel ' + channelName +
		' ============\n');
	let error_message = null;
	let client = null;
	let channel = null;
	try {
		// first setup the client for this org
		client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
		channel = client.getChannel(channelName);
		if(!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}
		const tx_id = client.newTransactionID(true); 
		const deployId = tx_id.getTransactionID();

		const request = {
			targets : peers,
			chaincodeId: chaincodeName,
			chaincodeType: chaincodeType,
			chaincodeVersion: chaincodeVersion,
			args: args,
			txId: tx_id,

			'endorsement-policy': {
			        identities: [
					{ role: { name: 'member', mspId: 'Org1MSP' }},
					{ role: { name: 'member', mspId: 'Org2MSP' }},
					{ role: { name: 'member', mspId: 'Org3MSP' }}
			        ],
			        policy: {
					'2-of':[{ 'signed-by': 0 }, { 'signed-by': 2 }]
			        }
		        }
		};

		if (functionName)
			request.fcn = functionName;

		let results = await channel.sendInstantiateProposal(request, 300000); //instantiate takes much longer

		const proposalResponses = results[0];
		const proposal = results[1];


		let all_good = true;
		for (const i in proposalResponses) {
			if (proposalResponses[i] instanceof Error) {
				all_good = false;
				error_message = util.format('instantiate proposal resulted in an error :: %s', proposalResponses[i].toString());
				logger.error(error_message);
			} else if (proposalResponses[i].response && proposalResponses[i].response.status === 200) {
				logger.info('instantiate proposal was good');
			} else {
				all_good = false;
				error_message = util.format('instantiate proposal was bad for an unknown reason %j', proposalResponses[i]);
				logger.error(error_message);
			}
		}

		if (all_good) {
			logger.info(util.format(
				'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
				proposalResponses[0].response.status, proposalResponses[0].response.message,
				proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));


			const promises = [];
			const event_hubs = channel.getChannelEventHubsForOrg();
			logger.debug('found %s eventhubs for this organization %s',event_hubs.length, org_name);
			event_hubs.forEach((eh) => {
				let instantiateEventPromise = new Promise((resolve, reject) => {
					logger.debug('instantiateEventPromise - setting up event');
					let event_timeout = setTimeout(() => {
						let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
						logger.error(message);
						eh.disconnect();
					}, 60000);
					eh.registerTxEvent(deployId, (tx, code, block_num) => {
						logger.info('The chaincode instantiate transaction has been committed on peer %s',eh.getPeerAddr());
						logger.info('Transaction %s has status of %s in blocl %s', tx, code, block_num);
						clearTimeout(event_timeout);

						if (code !== 'VALID') {
							let message = util.format('The chaincode instantiate transaction was invalid, code:%s',code);
							logger.error(message);
							reject(new Error(message));
						} else {
							let message = 'The chaincode instantiate transaction was valid.';
							logger.info(message);
							resolve(message);
						}
					}, (err) => {
						clearTimeout(event_timeout);
						logger.error(err);
						reject(err);
					},
						{unregister: true, disconnect: true}
					);
					eh.connect();
				});
				promises.push(instantiateEventPromise);
			});

			const orderer_request = {
				txId: tx_id, // must include the transaction id so that the outbound
							// transaction to the orderer will be signed by the admin id
							// the same as the proposal above, notice that transactionID
							// generated above was based on the admin id not the current
							// user assigned to the 'client' instance.
				proposalResponses: proposalResponses,
				proposal: proposal
			};
			const sendPromise = channel.sendTransaction(orderer_request);

			promises.push(sendPromise);
			const results = await Promise.all(promises);
			logger.debug(util.format('------->>> R E S P O N S E : %j', results));
			const response = results.pop(); 
			if (response.status === 'SUCCESS') {
				logger.info('Successfully sent transaction to the orderer.');
			} else {
				error_message = util.format('Failed to order the transaction. Error code: %s',response.status);
				logger.debug(error_message);
			}

			for(const i in results) {
				const event_hub_result = results[i];
				const event_hub = event_hubs[i];
				logger.debug('Event results for event hub :%s',event_hub.getPeerAddr());
				if(typeof event_hub_result === 'string') {
					logger.debug(event_hub_result);
				} else {
					if(!error_message) error_message = event_hub_result.toString();
					logger.debug(event_hub_result.toString());
				}
			}
		}
	} catch (error) {
		logger.error('Failed to send instantiate due to error: ' + error.stack ? error.stack : error);
		error_message = error.toString();
	} finally {
		if (channel) {
			channel.close();
		}
	}

	let success = true;
	let message = util.format('Successfully instantiate chaincode in organization %s to the channel \'%s\'', org_name, channelName);
	if (error_message) {
		message = util.format('Failed to instantiate the chaincode. cause:%s',error_message);
		success = false;
		logger.error(message);
	} else {
		logger.info(message);
	}

	const response = {
		success: success,
		message: message
	};
	return response;
};
exports.instantiateChaincode = instantiateChaincode;
