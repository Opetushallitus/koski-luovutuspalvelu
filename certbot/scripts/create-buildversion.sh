#!/bin/bash
set -euo pipefail

file=${1:-buildversion.txt}
version=${KOSKI_VERSION:-local}

cat >$file <<EOL
artifactId=koski-luovutuspalvelu-certbot
version=$version
vcsRevision=`git rev-parse HEAD`
buildDate=`date`
EOL