#!/bin/bash
set -eo pipefail
if [[ $# -ne 2 ]] ; then
    echo 'usage: check-base-image-date.sh path-to-Dockerfile not-older-than-days'
    exit 0
fi
dockerfile="$1"
days="$2"

image=$(grep ^FROM $dockerfile | head -1 | cut -d' ' -f2)
created=$(docker inspect -f '{{ .Created }}' $image)
days_ago=$(perl -MTime::Piece -e 'print localtime(time - '$days'*86400)->datetime')
echo Base image of $dockerfile, $image, was created on $created

if [[ $created < $days_ago ]]; then
    echo Base image is too old!
    exit 1
else
    echo Base image is recent enough
fi   
