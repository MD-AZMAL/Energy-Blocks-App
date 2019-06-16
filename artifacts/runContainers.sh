#!/bin/bash

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo

export CAORG1=$(cd channel/crypto-config/peerOrganizations/org1.example.com/ca && ls *_sk)
echo "Exported CAORG1 : $CAORG1"
echo

export CAORG2=$(cd channel/crypto-config/peerOrganizations/org2.example.com/ca && ls *_sk)
echo "Exported CAORG2 : $CAORG2"
echo

export CAORG3=$(cd channel/crypto-config/peerOrganizations/org3.example.com/ca && ls *_sk)
echo "Exported CAORG3 : $CAORG3"
echo

echo
echo "#################################################################"
echo "##### Executing Docker command for starting the network #########"
echo "#################################################################"

set -x
docker-compose -f docker-compose.yaml up
res=$?
set +x

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo
