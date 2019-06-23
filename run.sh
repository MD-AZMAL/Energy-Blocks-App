#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
./artifacts/channel/generateArtifacts.sh

./artifacts/channel/runContainers.sh

PORT=4000 node app
