# Energy-Blocks-App
Frequency based electricity billing on Hyperledger Fabric

# Setup the environment
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
* ## Use api from balace-transfer example to interact