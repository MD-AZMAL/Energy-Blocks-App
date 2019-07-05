# Energy-Blocks-App
Frequency based electricity billing on Hyperledger Fabric v1.4
This repo contains the demo of energy billing system based on frequency and using smart-grid. 

## Prerequisites
* Complete the [prerequisites](https://hyperledger-fabric.readthedocs.io/en/release-1.4/prereqs.html) for running fabric.
* [Install Samples, Binaries and Docker Images](https://hyperledger-fabric.readthedocs.io/en/release-1.4/install.html).
* Install [jq](https://stedolan.github.io/jq/)

## Quick Start

* Clone this repo:
```
git clone --recursive https://github.com/MD-AZMAL/Energy-Blocks-App.git
```
* Install dependencies
```
npm install
```
* Install dependencies for `frontend`
```
cd frontend && npm install
```
* Run network
```
./run.sh
```
Server should be should be available on `PORT=4000`.
* To Enroll In Organizations, open new terminal and run
```
./testAPI.sh
```
> Note: If instantiating chaincode fails, then manually instantiate using curl(Check the instantiation part from `testAPI.sh`).

Above command should create a `config.js` in `frontend/src/` with correct tokens. If this fails to generate then manually copy-paste the token to respective Organizations.
* Run Frontend part to interact with API.
```
cd frontend
npm start
```
Open browser and access client from [localhost:3000](localhost:3000).

To Stop and clean the network,
```
$ docker kill $(docker ps -q) 
$ docker rm $(docker ps -aq) # WARNING: this will remove all your containers.
```

### For Blockchain-Explorer

* Follow the step 2 and 3 of [this](https://medium.com/@thanawitsupinnapong/setting-up-hyperledger-explorer-on-fabric-5f1f7cda73b3) blog.
* Modify the config file in `blockchain-explorer/app/platform/fabric` and change `first-network` to `balance-transfer`.
* Copy the `balance-transfer-bk.json` to `blockchain-explorer/app/platform/fabric/connection-profile/`.
* Add these lines in `start.sh` in `blockchain-explorer`.
```
FABRIC_PATH=<path> # path to this repo.

ADMIN_KEY=$(ls $FABRIC_PATH/artifacts/channel/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore)

cp ./app/platform/fabric/connection-profile/balance-transfer-bk.json ./app/platform/fabric/connection-profile/balance-transfer.json

sed -i "s/<path>/${FABRIC_PATH}/g" ./app/platform/fabric/connection-profile/balance-transfer.json
# <path> to this repo e.g. /home/user/Energy-Blocks-App, then <path> = \/home\/user\/Energy-Blocks-App
sed -i "s/ADMIN_KEY/${ADMIN_KEY}/g" ./app/platform/fabric/connection-profile/balance-transfer.json

```
* Now follow step 6 and 7 from the above blog. Explorer should be running on [localhost:8080](localhost:8080).

## Description of files in Repository

filename                           |  description
----------------------------------|------------------------------------------------------------------------------------
app/*                        |  JS file for interacting with Fabric Network.
artifacts/channel/*                   |  Script for generating new artifacts and configtx and cryptogen.
artifacts/src/*                           |  Chaincode for energyblocks.
artifacts/runContainers.sh              | remove the old running containers and create new ones.
artifacts/modifyNetwork.sh            | Script to replace the key values for newly generated artifacts.
artifacts/\*-bkp.sh                 | Backup files to use for newly generated artifacts.
run.sh                            | Script to start new network
testAPI.sh                        | Script to enroll users in org and install chaincode using API calls
frontend/src/config.js         |  Configurations of users enrolled in Organizations
frontend/src/config-bk.js      | Backup file for config to be used to replace user token in `testAPI.sh`

## Resource 

* You can refer to the project report attached with this report.
* Energy Blocks test run can be found [here](https://www.youtube.com/watch?v=B0YDjU0LbOI&t=30s). 

