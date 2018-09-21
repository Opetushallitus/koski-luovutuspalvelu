
Developing locally (require virtualenv + python2)

    virtualenv test-env
    cd test-env
    source bin/activate
    pip install certbot certbot-dns-route53
    AWS_PROFILE=oph-koski-dev CERTBOT_DOMAIN=koski-luovutuspalvelu-dev.testiopintopolku.fi CERTBOT_PARAMETER_PREFIX=/dev/koski-luovutuspalvelu CERTBOT_PRODUCTION=no python ../main.py

Triggering

    aws ecs run-task --profile oph-koski-dev --cluster koski-ecs-cluster --task-definition koski_luovutuspalvelu_certbot