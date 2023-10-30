#!/bin/bash
set -euo pipefail

file=${1:-buildversion.txt}
version=$(git rev-parse HEAD)

cat >"$file" <<EOL
artifactId=koski-luovutuspalvelu-proxy
version=$version
buildNumber=$version
vcsRevision=$(git rev-parse HEAD)
buildDate=$(date)
EOL
