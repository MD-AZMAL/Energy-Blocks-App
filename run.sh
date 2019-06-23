#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
pushd ./artifacts/channel
./generateArtifacts.sh
popd

pushd ./artifacts
./runContainers.sh
popd

PORT=4000 node app
