#!/bin/bash
set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Usage: trigger.sh (dev/qa/prod)"
    exit 1
fi

ENV="$1"
PROFILE="oph-koski-$ENV"

RULE_TARGET=$(aws events list-targets-by-rule --rule koski-luovutuspalvelu-certbot-renew-event --profile "$PROFILE" | jq .Targets[0])
SUBNETS=$(echo "$RULE_TARGET" | jq -c .EcsParameters.NetworkConfiguration.awsvpcConfiguration.Subnets)
SECURITY_GROUPS=$(echo "$RULE_TARGET" | jq -c .EcsParameters.NetworkConfiguration.awsvpcConfiguration.SecurityGroups)

aws ecs run-task \
    --profile "$PROFILE" \
    --cluster koski-cluster \
    --network-configuration "awsvpcConfiguration={subnets=$SUBNETS, securityGroups=$SECURITY_GROUPS}" \
    --launch-type FARGATE \
    --task-definition koski_luovutuspalvelu_certbot
