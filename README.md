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

* ## Use api from balace-transfer example to interact