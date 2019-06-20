#!/bin/bash

GenesisOrgName="ThreeOrgsOrdererGenesis"
ChannelName="mychannel"
ChannelOrgName="ThreeOrgsChannel"

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo

echo
echo "##########################################################"
echo "#####  Delete Old certificates before genetating  ########"
echo "##########################################################"

set -x
./clearArtifacts.sh
res=$?
set +x

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

echo
echo "#################################################################"
echo "### Generating channel configuration transaction 'channel.tx' ###"
echo "#################################################################"
set -x
configtxgen -profile $ChannelOrgName -outputCreateChannelTx ./mychannel.tx -channelID $ChannelName
res=$?
set +x

echo
echo "#################################################################"
echo "#######    Generating anchor peer update for Org1MSP   ##########"
echo "#################################################################"
set -x
configtxgen -profile $ChannelOrgName -outputAnchorPeersUpdate ./Org1MSPanchors.tx -channelID $ChannelName -asOrg Org1MSP
res=$?
set +x

echo
echo "#################################################################"
echo "#######    Generating anchor peer update for Org2MSP   ##########"
echo "#################################################################"
set -x
configtxgen -profile $ChannelOrgName -outputAnchorPeersUpdate ./Org2MSPanchors.tx -channelID $ChannelName -asOrg Org2MSP
res=$?
set +x

echo
echo "#################################################################"
echo "#######    Generating anchor peer update for Org3MSP   ##########"
echo "#################################################################"
set -x
configtxgen -profile $ChannelOrgName -outputAnchorPeersUpdate ./Org3MSPanchors.tx -channelID $ChannelName -asOrg Org3MSP
res=$?
set +x

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo