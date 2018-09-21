#!/bin/bash
set -euo pipefail

file=${1:-buildversion.txt}
version=${KOSKI_VERSION:-local}

cat >$file <<EOL
artifactId=koski-luovutuspalvelu-proxy
version=$version
buildNumber=${TRAVIS_BUILD_NUMBER:-unknown}
vcsRevision=`git rev-parse HEAD`
buildDate=`date`
EOL
