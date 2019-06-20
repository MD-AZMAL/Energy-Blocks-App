'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('Helper');
logger.setLevel('DEBUG');

var path = require('path');
var util = require('util');

var hfc = require('fabric-client');
hfc.setLogger(logger);



async function getClientForOrg (userorg, username) {
	logger.debug('getClientForOrg - ****** START %s %s', userorg, username)
	let config = '-connection-profile-path';

	let client = hfc.loadFromConfig(hfc.getConfigSetting('network'+config));

	client.loadFromConfig(hfc.getConfigSetting(userorg+config));

	await client.initCredentialStores();

	if(username) {
		let user = await client.getUserContext(username, true);
		if(!user) {
			throw new Error(util.format('User was not found :', username));
		} else {
			logger.debug('User %s was found to be registered and enrolled', username);
		}
	}
	logger.debug('getClientForOrg - ****** END %s %s \n\n', userorg, username)

	return client;
}

var getRegisteredUser = async function (username, userOrg, isJson) {
	try {
		var client = await getClientForOrg(userOrg);
		logger.debug('Successfully initialized the credential stores');
		// client can now act as an agent for organization Org1
		// first check to see if the user is already enrolled
		var user = await client.getUserContext(username, true);
		if (user && user.isEnrolled()) {
			logger.info('Successfully loaded member from persistence');
			var response = {
				success: false,
			};
			return response;
		} else {
			// user was not enrolled, so we will need an admin user object to register
			logger.info('User %s was not enrolled, so we will need an admin user object to register', username);
			var admins = hfc.getConfigSetting('admins');
			let adminUserObj = await client.setUserContext({ username: admins[0].username, password: admins[0].secret });

			//newly added
			if (adminUserObj.getAffiliation() != userOrg.toLowerCase()) {
				logger.info('Admin affiliation not registered. Registering now.');
				adminUserObj.setAffiliation(userOrg.toLowerCase());
				adminUserObj.setRoles(['peer', 'orderer', 'client', 'user']);
				adminUserObj = await client.setUserContext(adminUserObj);
			}

			logger.info('Admin User: %s', adminUserObj);
			let affiliation = userOrg.toLowerCase() + '.department1';

			let caClient = client.getCertificateAuthority();

			//check if org exists
			const affiliationService = caClient.newAffiliationService();
			const registeredAffiliations = await affiliationService.getAll(adminUserObj);
			if (!registeredAffiliations.result.affiliations.some(x => x.name == userOrg.toLowerCase())) {
				logger.info('Register the new affiliation: %s ', affiliation);
				await affiliationService.create({ name: affiliation, force: true }, adminUserObj);
			}

			let secret = await caClient.register({
				enrollmentID: username,
				affiliation: affiliation
			}, adminUserObj);
			logger.debug('Successfully got the secret for user %s — %s', username);

			user = await client.setUserContext({ username: username, password: secret });
			logger.debug('Successfully enrolled username %s and setUserContext on the client object', username);

		}
		if (user && user.isEnrolled) {
			if (isJson && isJson === true) {
				var response = {
					success: true,
					secret: user._enrollmentSecret,
					message: username + ' enrolled Successfully',
				};
				return response;
			}
		} else {
			throw new Error('User was not enrolled ');
		}
	} catch (error) {
		let message = 'Failed to register the username ' + username + ' for organization ' + userOrg + ' with error: ' + error.toString();
		logger.error(message);
		var response = {
			success: false,
			message: message,
		};
		return response;
	}

};


var setupChaincodeDeploy = function() {
	process.env.GOPATH = path.join(__dirname, hfc.getConfigSetting('CC_SRC_PATH'));
};

var getLogger = function(moduleName) {
	var logger = log4js.getLogger(moduleName);
	logger.setLevel('DEBUG');
	return logger;
};

exports.getClientForOrg = getClientForOrg;
exports.getLogger = getLogger;
exports.setupChaincodeDeploy = setupChaincodeDeploy;
exports.getRegisteredUser = getRegisteredUser;
