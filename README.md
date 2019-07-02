# Energy-Blocks-App
Frequency based electricity billing on Hyperledger Fabric

# Setup the environment in Terminal 1
```
cd artifacts/channels/
chmod +x clearArtifacts.sh
./clearArtifacts.sh
chmod +x generateArtifacts.sh
./generateArtifacts.sh
cd ../
chmod +x runContainer.sh
./runContainer.sh
cd ../
PORT=4000 node app
```

# Terminal 2 to test api
```
chmod +x testAPI.sh
./testAPI.sh
```

## For Blockchain-Explorer

Add the line below in `start.sh` for blockchain-explorer:
```
FABRIC_PATH=<path to this repo>

ADMIN_KEY=$(ls $FABRIC_PATH/artifacts/channel/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore)

cp ./app/platform/fabric/connection-profile/balance-transfer-bk.json ./app/platform/fabric/connection-profile/balance-transfer.json

sed -i "s/FABRIC_PATH/${FABRIC_PATH}/g" ./app/platform/fabric/connection-profile/balance-transfer.json

sed -i "s/ADMIN_KEY/${ADMIN_KEY}/g" ./app/platform/fabric/connection-profile/balance-transfer.json

```

* ## Use api from balace-transfer example to interact