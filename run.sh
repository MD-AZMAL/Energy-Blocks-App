#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# In case of timeout error while creating containers
COMPOSE_HTTP_TIMEOUT=120

pushd ./artifacts/channel/

./generateArtifacts.sh

popd

pushd ./artifacts/

./runContainers.sh

popd

PORT=4000 node app
