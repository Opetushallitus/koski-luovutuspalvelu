Requirements for local development:

 * Docker

Build image and run test in oph-koski-dev
(assumes AWS credentials as described in koski-aws-infra/README.md).
Note that this uses Let's Encrypt "Staging Environment"
(not production, to avoid rate limits etc.)

    ./scripts/build.sh
    ./scripts/run-locally-against-dev.sh

Triggering run in actual AWS:

    aws ecs run-task --profile oph-koski-dev --cluster koski-ecs-cluster --task-definition koski_luovutuspalvelu_certbot
