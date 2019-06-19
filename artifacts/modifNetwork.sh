#!/bin/bash

echo
echo "Restoring network config"
cp network-config-bkp.yaml network-config.yaml

set -x
sed -i "s/{ca1}/$(cd channel/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/ && ls *_sk)/g" network-config.yaml
res=$?
set +x
echo "Modified ca1 credentials"

set -x
sed -i "s/{ca2}/$(cd channel/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore/ && ls *_sk)/g" network-config.yaml
res=$?
set +x
echo "Modified ca2 credentials"

set -x
sed -i "s/{ca3}/$(cd channel/crypto-config/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp/keystore/ && ls *_sk)/g" network-config.yaml
res=$?
set +x
echo "Modified ca3 credentials"

cp docker-compose-bkp.yaml docker-compose.yaml

set -x
sed -i "s/{ca1}/$(cd channel/crypto-config/peerOrganizations/org1.example.com/ca/ && ls *_sk)/g" docker-compose.yaml
res=$?
set +x
echo "Modified ca1 credentials"

set -x
sed -i "s/{ca2}/$(cd channel/crypto-config/peerOrganizations/org2.example.com/ca/ && ls *_sk)/g" docker-compose.yaml
res=$?
set +x
echo "Modified ca2 credentials"

set -x
sed -i "s/{ca3}/$(cd channel/crypto-config/peerOrganizations/org3.example.com/ca/ && ls *_sk)/g" docker-compose.yaml
res=$?
set +x
echo "Modified ca3 credentials"