#!/bin/bash


function dkcl(){
        CONTAINER_IDS=$(docker ps -aq)
	echo
        if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" = " " ]; then
                echo "========== No containers available for deletion =========="
        else
                docker rm -f $CONTAINER_IDS
        fi
	echo
}

function dkrm(){
        DOCKER_IMAGE_IDS=$(docker images | grep "dev\|none\|test-vp\|peer[0-9]-" | awk '{print $3}')
	echo
        if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" = " " ]; then
		echo "========== No images available for deletion ==========="
        else
                docker rmi -f $DOCKER_IMAGE_IDS
        fi
	echo
}


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
docker-compose -f docker-compose.yaml down
res=$?
set+x

dkcl
dkrm
rm -rf ./fabric-client-kv-org*

set -x
docker-compose -f docker-compose.yaml up -d
res=$?
set +x

set -x
./modifNetwork.sh
res=$?
set +x

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo
