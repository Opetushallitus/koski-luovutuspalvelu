
Requirements for local development:

 * Docker
 * Node.js (tested with 8.x)
 * openssl command line tool (probably comes with OSX/Linux already)

Building image and run tests locally:

    npm run local
    # in separate terminal
    npm run test

In case something doesn't work, run shell in existing container:

    npm run shell

Testing get-config-from-aws.py against oph-koski-dev AWS
(assumes AWS credentials as described in koski-aws-infra/README.md):

    npm run test-aws-config-dev

