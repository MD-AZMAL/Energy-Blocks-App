GenesisOrgName = "ThreeOrgsOrdererGenesis"
ChannelName = "mychannel"


echo
echo "##########################################################"
echo "##### Generate certificates using cryptogen tool #########"
echo "##########################################################"

set -x
cryptogen generate --config=cryptogen.yaml
res=$?
set +x

echo
echo "##########################################################"
echo "#########  Generating Orderer Genesis block ##############"
echo "##########################################################"

set -x 
configtxgen -profile $GenesisOrgName -channelID $ChannelName -outputBlock ./genesis.block
res=$?
set +x
