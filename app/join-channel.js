var util = require('util');

var helper = require('./helper.js');
var logger = helper.getLogger('Join-Channel');

var joinChannel = async function (channel_name, peers, username, org_name) {
	logger.debug('\n\n============ Join Channel start ============\n')
	var error_message = null;
	var all_eventhubs = [];
	try {
		logger.info('Calling peers in organization "%s" to join the channel', org_name);

		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
		var channel = client.getChannel(channel_name);
		if (!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channel_name);
			logger.error(message);
			throw new Error(message);
		}

		let request = {
			txId: client.newTransactionID(true)
		};
		let genesis_block = await channel.getGenesisBlock(request);

		var promises = [];
		promises.push(new Promise(resolve => setTimeout(resolve, 10000)));

		let join_request = {
			targets: peers,
			txId: client.newTransactionID(true),
			block: genesis_block
		};
		let join_promise = channel.joinChannel(join_request);
		promises.push(join_promise);
		let results = await Promise.all(promises);
		logger.debug(util.format('Join Channel R E S P O N S E : %j', results));

		let peers_results = results.pop();

		for (let i in peers_results) {
			let peer_result = peers_results[i];
			if (peer_result instanceof Error) {
				error_message = util.format('Failed to join peer to the channel with error :: %s', peer_result.toString());
				logger.error(error_message);
			} else if (peer_result.response && peer_result.response.status == 200) {
				logger.info('Successfully joined peer to the channel %s', channel_name);
			} else {
				error_message = util.format('Failed to join peer to the channel %s', channel_name);
				logger.error(error_message);
			}
		}
	} catch (error) {
		logger.error('Failed to join channel due to error: ' + error.stack ? error.stack : error);
		error_message = error.toString();
	}

	all_eventhubs.forEach((eh) => {
		eh.disconnect();
	});

	if (!error_message) {
		let message = util.format(
			'Successfully joined peers in organization %s to the channel:%s',
			org_name, channel_name);
		logger.info(message);
		const response = {
			success: true,
			message: message
		};
		return response;
	} else {
		let message = util.format('Failed to join all peers to channel. cause:%s', error_message);
		logger.error(message);
		const response = {
			success: false,
			message: message
		};
		return response;
	}
};
exports.joinChannel = joinChannel;
