/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

// ====CHAINCODE EXECUTION SAMPLES (CLI) ==================

// ==== Invoke marbles ====
// peer chaincode invoke -C myc1 -n marbles -c '{"Args":["initMarble","marble1","blue","35","tom"]}'
// peer chaincode invoke -C myc1 -n marbles -c '{"Args":["initMarble","marble2","red","50","tom"]}'
// peer chaincode invoke -C myc1 -n marbles -c '{"Args":["initMarble","marble3","blue","70","tom"]}'
// peer chaincode invoke -C myc1 -n marbles -c '{"Args":["transferMarble","marble2","jerry"]}'
// peer chaincode invoke -C myc1 -n marbles -c '{"Args":["transferMarblesBasedOnColor","blue","jerry"]}'
// peer chaincode invoke -C myc1 -n marbles -c '{"Args":["delete","marble1"]}'

// ==== Query marbles ====
// peer chaincode query -C myc1 -n marbles -c '{"Args":["readMarble","marble1"]}'
// peer chaincode query -C myc1 -n marbles -c '{"Args":["getMarblesByRange","marble1","marble3"]}'
// peer chaincode query -C myc1 -n marbles -c '{"Args":["getHistoryForMarble","marble1"]}'
// peer chaincode query -C myc1 -n marbles -c '{"Args":["getMarblesByRangeWithPagination","marble1","marble3","3",""]}'

// Rich Query (Only supported if CouchDB is used as state database):
// peer chaincode query -C myc1 -n marbles -c '{"Args":["queryMarblesByOwner","tom"]}'
// peer chaincode query -C myc1 -n marbles -c '{"Args":["queryMarbles","{\"selector\":{\"owner\":\"tom\"}}"]}'

// Rich Query with Pagination (Only supported if CouchDB is used as state database):
// peer chaincode query -C myc1 -n marbles -c '{"Args":["queryMarblesWithPagination","{\"selector\":{\"owner\":\"tom\"}}","3",""]}'

'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {
  async Init(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    console.info('=========== Instantiated Energyblocks Chaincode ===========');
    return shim.success();
  }

  async Invoke(stub) {
    console.info('Transaction ID: ' + stub.getTxID());
    console.info(util.format('Args: %j', stub.getArgs()));

    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.log('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params, this);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  // ===================================================
  // getBill based on frequecy and unit of consumption
  // ===================================================
  getPrice(freq, unit) {
    return parseFloat((unit * (5 - (50-freq)*0.8)).toFixed(3));
  }

  // ===============================================
  // initFreq - create a new frequency
  // ===============================================
  async initFreq(stub, args, thisClass) {


    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }
    // ==== Input sanitation ====
    console.info('--- start init freq ---')
    // Time in unix format
    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].length <= 0) {
      throw new Error('3rd argument must be a non-empty string');
    }
    let startTime = parseInt(args[0]);
    let endTime = parseInt(args[1]);
    let avgFreq = parseFloat(args[2]);
    if (typeof startTime !== 'number' && typeof endTime !== 'number' && typeof avgFreq !== 'number') {
      throw new Error('Arguments must be a numeric string');
    }

    // ==== Check if marble already exists ====
    let freqState = await stub.getState('F~' + args[0]); // args[0] = string startTime
    if (freqState.toString()) {
      throw new Error('This block already exists with start time: ' + startTime);
    }

    // ==== Create marble object and marshal to JSON ====
    let freq = {};
    freq.startTime = startTime;
    freq.endTime = endTime;
    freq.avgFreq = avgFreq;

    // === Save marble to state ===
    await stub.putState('F~' + args[0], Buffer.from(JSON.stringify(freq)));
    let indexName = 'F~startTime~endTime'
    let startTimeaEndTimeIndexKey = await stub.createCompositeKey(indexName, [`${freq.startTime}`, `${freq.endTime}`]);
    console.info(startTimeaEndTimeIndexKey);
    //  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the freq.
    //  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
    await stub.putState(startTimeaEndTimeIndexKey, Buffer.from('\u0000'));
    // ==== Marble saved and indexed. Return success ====
    console.info('- end init freq');
  }

  // ===============================================
  // initUnit - create a new unit
  // ===============================================
  async initUnit(stub, args, thisClass) {

    if (args.length != 5) {
      throw new Error('Incorrect number of arguments. Expecting 5');
    }
    // ==== Input sanitation ====
    console.info('--- start init unit ---')
    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].length <= 0) {
      throw new Error('3rd argument must be a non-empty string');
    }
    if (args[3].length <= 0) {
      throw new Error('4th argument must be a non-empty string');
    }
    if (args[4].length <= 0) {
      throw new Error('5th argument must be a non-empty string');
    }
    let societyID = args[0];
    let stationID = args[1];
    let startTime = parseInt(args[2]);
    let endTime = parseInt(args[3]);
    let units = parseFloat(args[4]);
    if (typeof startTime !== 'number' && typeof endTime !== 'number' && typeof units !== 'number') {
      throw new Error('3rd, 4th, 5th arguments must be a numeric string');
    }

    // ==== Check if unit already exists ====
    let unitState = await stub.getState('U~' + societyID + stationID + args[2]); //arg[2] = string startTime
    if (unitState.toString()) {
      throw new Error('This unit already exist between: ' + societyID + '~' + stationID);
    }

    // ==== Create unit object and marshal to JSON ====
    let unit = {};
    unit.societyId = societyID;
    unit.stationId = stationID;
    unit.startTime = startTime;
    unit.endTime = endTime;
    unit.units = units;

    // === Save unit to state ===
    await stub.putState('U~' + societyID + stationID + args[2], Buffer.from(JSON.stringify(unit)));
    let indexName = 'U~societyId~stationId'
    let societyIdStationIdIndexKey = await stub.createCompositeKey(indexName, [unit.societyId, unit.stationId]);
    console.info(societyIdStationIdIndexKey);
    //  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
    //  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
    await stub.putState(societyIdStationIdIndexKey, Buffer.from('\u0000'));
    // ==== Marble saved and indexed. Return success ====
    console.info('- end init unit');
  }

  // ===============================================
  // initBill - create a new bill
  // ===============================================
  async initBill(stub, args, thisClass) {

    if (args.length != 4) {
      throw new Error('Incorrect number of arguments. Expecting 4');
    }
    // ==== Input sanitation ====
    console.info('--- start init bill ---')
    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].length <= 0) {
      throw new Error('3rd argument must be a non-empty string');
    }
    if (args[3].length <= 0) {
      throw new Error('4th argument must be a non-empty string');
    }

    let societyID = args[0];
    let stationID = args[1];
    let startTime = parseInt(args[2]);
    let endTime = parseInt(args[3]);
    if (typeof startTime !== 'number' && typeof endTime !== 'number') {
      throw new Error('3rd, 4th arguments must be a numeric string');
    }

    // ==== Check if unit already exists ====
    let billState = await stub.getState('B~' + societyID + stationID + args[2]); //arg[2] = string startTime
    if (billState.toString()) {
      throw new Error('This bill already exist between: ' + societyID + '~' + stationID);
    }

    // get freq from freqBlock
    let freqAsbytes = await stub.getState('F~' + args[2]); //get the freq from chaincode state
    let jsonResp = {};
    if (!freqAsbytes) {
      jsonResp.error = 'freq does not exist with start time: ' + args[2];
      throw new Error(jsonResp);
    }
    let freqJSON = {};
    try {
      freqJSON = JSON.parse(freqAsbytes.toString());
    } catch (err) {
      jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of freq Block with start time: ' + args[2];
      throw new Error(jsonResp);
    }

    // get units from unitBlock
    let unitAsbytes = await stub.getState('U~' + societyID + stationID + args[2]); //get the unit from chaincode state
    if (!unitAsbytes) {
      jsonResp.error = 'Unit does not exist with between: ' + societyID + '~' + stationID;
      throw new Error(jsonResp);
    }
    let unitJSON = {};
    try {
      unitJSON = JSON.parse(unitAsbytes.toString());
    } catch (err) {
      jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of unit Block between: ' + societyID + '~' + stationID;
      throw new Error(jsonResp);
    }

    let method = thisClass['getPrice'];
    let price = method(freqJSON.avgFreq, unitJSON.units);

    // ==== Create unit object and marshal to JSON ====
    let bill = {};
    bill.societyId = societyID;
    bill.stationId = stationID;
    bill.startTime = startTime;
    bill.endTime = endTime;
    bill.price = price;

    // === Save unit to state ===
    await stub.putState('B~' + societyID + stationID + args[2], Buffer.from(JSON.stringify(bill)));
    let indexName = 'B~societyId~stationId'
    let societyIdStationIdIndexKey = await stub.createCompositeKey(indexName, [bill.societyId, bill.stationId]);
    console.info(societyIdStationIdIndexKey);
    //  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
    //  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
    await stub.putState(societyIdStationIdIndexKey, Buffer.from('\u0000'));
    // ==== Marble saved and indexed. Return success ====
    console.info('- end init bill');
  }

  // ===============================================
  // readFreq - read a frequency from chaincode state
  // ===============================================
  async readFreq(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting name of the marble to query');
    }

    let startTime = parseInt(args[0]);
    if (!startTime && typeof startTime !== 'number') {
      throw new Error(' startTime must be a non-empty, number');
    }
    let freqAsbytes = await stub.getState('F~' + args[0]); //get the frequency from chaincode state
    if (!freqAsbytes.toString()) {
      let jsonResp = {};
      jsonResp.Error = 'Frequency does not exist with starting time: ' + args[0];
      throw new Error(JSON.stringify(jsonResp));
    }
    console.info('=======================================');
    console.log(freqAsbytes.toString());
    console.info('=======================================');
    return freqAsbytes;
  }

  // ===============================================
  // readUnit - read a unit from chaincode state
  // ===============================================
  async readUnit(stub, args, thisClass) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3 args to query');
    }
    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].length <= 0) {
      throw new Error('3rd argument must be a non-empty string');
    }

    let societyID = args[0];
    let stationID = args[1];
    let startTime = parseInt(args[2]);
    if (typeof startTime !== 'number') {
      throw new Error('3rd argument must be a numeric string');
    }
    let unitAsbytes = await stub.getState('U~' + societyID + stationID + args[2]); //get the units from chaincode state
    if (!unitAsbytes.toString()) {
      let jsonResp = {};
      jsonResp.Error = 'Unit does not exist between: ' + societyID + '~' + stationID;
      throw new Error(JSON.stringify(jsonResp));
    }
    console.info('=======================================');
    console.log(unitAsbytes.toString());
    console.info('=======================================');
    return unitAsbytes;
  }

  // ===============================================
  // readBill - read a bill from chaincode state
  // ===============================================
  async readBill(stub, args, thisClass) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3 args to query');
    }
    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].length <= 0) {
      throw new Error('3rd argument must be a non-empty string');
    }

    let societyID = args[0];
    let stationID = args[1];
    let startTime = parseInt(args[2]);
    if (typeof startTime !== 'number') {
      throw new Error('3rd argument must be a numeric string');
    }
    let billAsbytes = await stub.getState('B~' + societyID + stationID + args[2]); //get the units from chaincode state
    if (!billAsbytes.toString()) {
      let jsonResp = {};
      jsonResp.Error = 'Bill does not exist between: ' + societyID + '~' + stationID;
      throw new Error(JSON.stringify(jsonResp));
    }
    console.info('=======================================');
    console.log(billAsbytes.toString());
    console.info('=======================================');
    return billAsbytes;
  }

  // ==================================================
  // delete - remove a freq key/value pair from state
  // ==================================================
  async deleteFreq(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting startTime of freq to delete');
    }
    let startTime = parseInt(args[0]);
    if (!startTime && typeof startTime !== 'number') {
      throw new Error(' startTime must be a non-empty, number');
    }
    // to maintain the F~startTime~endTime index, we need to read the freq first and get its color
    let freqAsbytes = await stub.getState('F~' + startTime); //get the freq from chaincode state
    let jsonResp = {};
    if (!freqAsbytes) {
      jsonResp.error = 'freq does not exist with start time: ' + args[0];
      throw new Error(jsonResp);
    }
    let freqJSON = {};
    try {
      freqJSON = JSON.parse(freqAsbytes.toString());
    } catch (err) {
      jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of freq with start Time: ' + args[0];
      throw new Error(jsonResp);
    }

    await stub.deleteState('F~' + startTime); //remove the marble from chaincode state

    // delete the index
    let indexName = 'F~startTime~endTime'
    let startTimeaEndTimeIndexKey = await stub.createCompositeKey(indexName, [freqJSON.startTime, freqJSON.endTime]);
    if (!startTimeaEndTimeIndexKey) {
      throw new Error(' Failed to create the createCompositeKey');
    }
    //  Delete index entry to state.
    await stub.deleteState(startTimeaEndTimeIndexKey);
  }

  // ==================================================
  // delete - remove a unit key/value pair from state
  // ==================================================
  async deleteUnit(stub, args, thisClass) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3 args to delete');
    }
    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].length <= 0) {
      throw new Error('3rd argument must be a non-empty string');
    }

    let societyID = args[0];
    let stationID = args[1];
    let startTime = parseInt(args[2]);
    if (typeof startTime !== 'number') {
      throw new Error('3rd argument must be a numeric string');
    }
  
    // to maintain the U~societyId~stationId index, we need to read the unit first
    let unitAsbytes = await stub.getState('U~' + societyID + stationID + args[2]); //get the unit from chaincode state
    let jsonResp = {};
    if (!unitAsbytes) {
      jsonResp.error = 'unit does not exist between: ' + societyID + '~' + stationID;
      throw new Error(jsonResp);
    }
    let unitJSON = {};
    try {
      unitJSON = JSON.parse(unitAsbytes.toString());
    } catch (err) {
      jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of unit between: '+ societyID + '~' + stationID;
      throw new Error(jsonResp);
    }

    await stub.deleteState('U~' + societyID + stationID + args[2]); //remove the unit from chaincode state

    // delete the index
    let indexName = 'U~societyId~stationId'
    let societyIdStationIdIndexKey = await stub.createCompositeKey(indexName, [unitJSON.societyId, unitJSON.stationId]);
    if (!societyIdStationIdIndexKey) {
      throw new Error(' Failed to create the createCompositeKey');
    }
    //  Delete index entry to state.
    await stub.deleteState(societyIdStationIdIndexKey);
  }

  // ==================================================
  // delete - remove a unit key/value pair from state
  // ==================================================
  async deleteBill(stub, args, thisClass) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3 args to delete');
    }
    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].length <= 0) {
      throw new Error('3rd argument must be a non-empty string');
    }

    let societyID = args[0];
    let stationID = args[1];
    let startTime = parseInt(args[2]);
    if (typeof startTime !== 'number') {
      throw new Error('3rd argument must be a numeric string');
    }
  
    // to maintain the U~societyId~stationId index, we need to read the unit first
    let billAsbytes = await stub.getState('B~' + societyID + stationID + args[2]); //get the unit from chaincode state
    let jsonResp = {};
    if (!billAsbytes) {
      jsonResp.error = 'bill does not exist between: '+ societyID + '~' + stationID;
      throw new Error(jsonResp);
    }
    let billJSON = {};
    try {
      billJSON = JSON.parse(billAsbytes.toString());
    } catch (err) {
      jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of bill between: ' + societyID + '~' + stationID;
      throw new Error(jsonResp);
    }

    await stub.deleteState('B~' + societyID + stationID + args[2]); //remove the unit from chaincode state

    // delete the index
    let indexName = 'B~societyId~stationId'
    let societyIdStationIdIndexKey = await stub.createCompositeKey(indexName, [billJSON.societyId, billJSON.stationId]);
    if (!societyIdStationIdIndexKey) {
      throw new Error(' Failed to create the createCompositeKey');
    }
    //  Delete index entry to state.
    await stub.deleteState(societyIdStationIdIndexKey);
  }

  // ===========================================================
  // transfer a marble by setting a new owner name on the marble
  // ===========================================================
  async transferMarble(stub, args, thisClass) {
    //   0       1
    // 'name', 'bob'
    if (args.length < 2) {
      throw new Error('Incorrect number of arguments. Expecting marblename and owner')
    }

    let marbleName = args[0];
    let newOwner = args[1].toLowerCase();
    console.info('- start transferMarble ', marbleName, newOwner);

    let marbleAsBytes = await stub.getState(marbleName);
    if (!marbleAsBytes || !marbleAsBytes.toString()) {
      throw new Error('marble does not exist');
    }
    let marbleToTransfer = {};
    try {
      marbleToTransfer = JSON.parse(marbleAsBytes.toString()); //unmarshal
    } catch (err) {
      let jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + marbleName;
      throw new Error(jsonResp);
    }
    console.info(marbleToTransfer);
    marbleToTransfer.owner = newOwner; //change the owner

    let marbleJSONasBytes = Buffer.from(JSON.stringify(marbleToTransfer));
    await stub.putState(marbleName, marbleJSONasBytes); //rewrite the marble

    console.info('- end transferMarble (success)');
  }

  // ===========================================================================================
  // getMarblesByRange performs a range query based on the start and end keys provided.

  // Read-only function results are not typically submitted to ordering. If the read-only
  // results are submitted to ordering, or if the query is used in an update transaction
  // and submitted to ordering, then the committing peers will re-execute to guarantee that
  // result sets are stable between endorsement time and commit time. The transaction is
  // invalidated by the committing peers if the result set has changed between endorsement
  // time and commit time.
  // Therefore, range queries are a safe option for performing update transactions based on query results.
  // ===========================================================================================
  async getMarblesByRange(stub, args, thisClass) {

    if (args.length < 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let startKey = args[0];
    let endKey = args[1];

    let resultsIterator = await stub.getStateByRange(startKey, endKey);
    let method = thisClass['getAllResults'];
    let results = await method(resultsIterator, false);

    return Buffer.from(JSON.stringify(results));
  }

  // ==== Example: GetStateByPartialCompositeKey/RangeQuery =========================================
  // transferMarblesBasedOnColor will transfer marbles of a given color to a certain new owner.
  // Uses a GetStateByPartialCompositeKey (range query) against color~name 'index'.
  // Committing peers will re-execute range queries to guarantee that result sets are stable
  // between endorsement time and commit time. The transaction is invalidated by the
  // committing peers if the result set has changed between endorsement time and commit time.
  // Therefore, range queries are a safe option for performing update transactions based on query results.
  // ===========================================================================================
  async transferMarblesBasedOnColor(stub, args, thisClass) {

    //   0       1
    // 'color', 'bob'
    if (args.length < 2) {
      throw new Error('Incorrect number of arguments. Expecting color and owner');
    }

    let color = args[0];
    let newOwner = args[1].toLowerCase();
    console.info('- start transferMarblesBasedOnColor ', color, newOwner);

    // Query the color~name index by color
    // This will execute a key range query on all keys starting with 'color'
    let coloredMarbleResultsIterator = await stub.getStateByPartialCompositeKey('color~name', [color]);

    let method = thisClass['transferMarble'];
    // Iterate through result set and for each marble found, transfer to newOwner
    while (true) {
      let responseRange = await coloredMarbleResultsIterator.next();
      if (!responseRange || !responseRange.value || !responseRange.value.key) {
        return;
      }
      console.log(responseRange.value.key);

      // let value = res.value.value.toString('utf8');
      let objectType;
      let attributes;
      ({
        objectType,
        attributes
      } = await stub.splitCompositeKey(responseRange.value.key));

      let returnedColor = attributes[0];
      let returnedMarbleName = attributes[1];
      console.info(util.format('- found a marble from index:%s color:%s name:%s\n', objectType, returnedColor, returnedMarbleName));

      // Now call the transfer function for the found marble.
      // Re-use the same function that is used to transfer individual marbles
      let response = await method(stub, [returnedMarbleName, newOwner]);
    }

    let responsePayload = util.format('Transferred %s marbles to %s', color, newOwner);
    console.info('- end transferMarblesBasedOnColor: ' + responsePayload);
  }


  // ===== Example: Parameterized rich query =================================================
  // queryMarblesByOwner queries for marbles based on a passed in owner.
  // This is an example of a parameterized query where the query logic is baked into the chaincode,
  // and accepting a single query parameter (owner).
  // Only available on state databases that support rich query (e.g. CouchDB)
  // =========================================================================================
  async queryMarblesByOwner(stub, args, thisClass) {
    //   0
    // 'bob'
    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting owner name.')
    }

    let owner = args[0].toLowerCase();
    let queryString = {};
    queryString.selector = {};
    queryString.selector.docType = 'marble';
    queryString.selector.owner = owner;
    let method = thisClass['getQueryResultForQueryString'];
    let queryResults = await method(stub, JSON.stringify(queryString), thisClass);
    return queryResults; //shim.success(queryResults);
  }

  // ===== Example: Ad hoc rich query ========================================================
  // queryMarbles uses a query string to perform a query for marbles.
  // Query string matching state database syntax is passed in and executed as is.
  // Supports ad hoc queries that can be defined at runtime by the client.
  // If this is not desired, follow the queryMarblesForOwner example for parameterized queries.
  // Only available on state databases that support rich query (e.g. CouchDB)
  // =========================================================================================
  async queryMarbles(stub, args, thisClass) {
    //   0
    // 'queryString'
    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting queryString');
    }
    let queryString = args[0];
    if (!queryString) {
      throw new Error('queryString must not be empty');
    }
    let method = thisClass['getQueryResultForQueryString'];
    let queryResults = await method(stub, queryString, thisClass);
    return queryResults;
  }

  async getAllResults(iterator, isHistory) {
    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        if (isHistory && isHistory === true) {
          jsonRes.TxId = res.value.tx_id;
          jsonRes.Timestamp = res.value.timestamp;
          jsonRes.IsDelete = res.value.is_delete.toString();
          try {
            jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Value = res.value.value.toString('utf8');
          }
        } else {
          jsonRes.Key = res.value.key;
          try {
            jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Record = res.value.value.toString('utf8');
          }
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return allResults;
      }
    }
  }

  // =========================================================================================
  // getQueryResultForQueryString executes the passed in query string.
  // Result set is built and returned as a byte array containing the JSON results.
  // =========================================================================================
  async getQueryResultForQueryString(stub, queryString, thisClass) {

    console.info('- getQueryResultForQueryString queryString:\n' + queryString)
    let resultsIterator = await stub.getQueryResult(queryString);
    let method = thisClass['getAllResults'];

    let results = await method(resultsIterator, false);

    return Buffer.from(JSON.stringify(results));
  }

  async getHistoryForMarble(stub, args, thisClass) {

    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting 1')
    }
    let marbleName = args[0];
    console.info('- start getHistoryForMarble: %s\n', marbleName);

    let resultsIterator = await stub.getHistoryForKey(marbleName);
    let method = thisClass['getAllResults'];
    let results = await method(resultsIterator, true);

    return Buffer.from(JSON.stringify(results));
  }

  // ====== Pagination =========================================================================
  // Pagination provides a method to retrieve records with a defined pagesize and
  // start point (bookmark).  An empty string bookmark defines the first "page" of a query
  // result. Paginated queries return a bookmark that can be used in
  // the next query to retrieve the next page of results. Paginated queries extend
  // rich queries and range queries to include a pagesize and bookmark.
  //
  // Two examples are provided in this example. The first is getMarblesByRangeWithPagination
  // which executes a paginated range query.
  // The second example is a paginated query for rich ad-hoc queries.
  // =========================================================================================

  // ====== Example: Pagination with Range Query ===============================================
  // getMarblesByRangeWithPagination performs a range query based on the start & end key,
  // page size and a bookmark.
  //
  // The number of fetched records will be equal to or lesser than the page size.
  // Paginated range queries are only valid for read only transactions.
  // ===========================================================================================
  async getMarblesByRangeWithPagination(stub, args, thisClass) {
    if (args.length < 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }
    const startKey = args[0];
    const endKey = args[1];

    const pageSize = parseInt(args[2], 10);
    const bookmark = args[3];

    const { iterator, metadata } = await stub.getStateByRangeWithPagination(startKey, endKey, pageSize, bookmark);
    const getAllResults = thisClass['getAllResults'];
    const results = await getAllResults(iterator, false);
    // use RecordsCount and Bookmark to keep consistency with the go sample
    results.ResponseMetadata = {
      RecordsCount: metadata.fetched_records_count,
      Bookmark: metadata.bookmark,
    };
    return Buffer.from(JSON.stringify(results));
  }

  // =========================================================================================
  // getQueryResultForQueryStringWithPagination executes the passed in query string with
  // pagination info. Result set is built and returned as a byte array containing the JSON results.
  // =========================================================================================
  async queryMarblesWithPagination(stub, args, thisClass) {

    //   0
    // "queryString"
    if (args.length < 3) {
      return shim.Error("Incorrect number of arguments. Expecting 3")
    }

    const queryString = args[0];
    const pageSize = parseInt(args[2], 10);
    const bookmark = args[3];

    const { iterator, metadata } = await stub.GetQueryResultWithPagination(queryString, pageSize, bookmark);
    const getAllResults = thisClass['getAllResults'];
    const results = await getAllResults(iterator, false);
    // use RecordsCount and Bookmark to keep consistency with the go sample
    results.ResponseMetadata = {
      RecordsCount: metadata.fetched_records_count,
      Bookmark: metadata.bookmark,
    };

    return Buffer.from(JSON.stringify(results));
  }
};

shim.start(new Chaincode());
