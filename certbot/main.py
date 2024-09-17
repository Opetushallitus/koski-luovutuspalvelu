# based on https://github.com/rog2/certbot-lambda/blob/master/main.py

import os
import shutil
import boto3
import certbot.main
import json


# Temp dir
CERTBOT_DIR = '/tmp/certbot'

def obtain_certs(domain, use_staging):
    certbot_args = [
        # Override directory paths so script doesn't have to be run as root
        '--config-dir', CERTBOT_DIR,
        '--work-dir', CERTBOT_DIR,
        '--logs-dir', CERTBOT_DIR,
        # Obtain a cert but don't install it
        'certonly',
        # Run in non-interactive mode
        '--non-interactive',
        # Agree to the terms of service
        '--agree-tos',
        # Don't send email
        '--register-unsafely-without-email',
        # Use dns challenge with route53
        '--dns-route53',
        '--preferred-challenges', 'dns-01',
        # Domain to provision certs for
        '--domain', domain,
    ]
    if use_staging:
        certbot_args.append('--staging')
    return certbot.main.main(certbot_args)

def upload_certs(domain, parameter_prefix):
    # In case of comma-separated domains the certificate is saved to the first domain
    domains = domain.split(",")
    fullchain_file = os.path.join(CERTBOT_DIR, 'live', domains[0], 'fullchain.pem')
    privkey_file = os.path.join(CERTBOT_DIR, 'live', domains[0], 'privkey.pem')
    print(f'Reading {fullchain_file} and {privkey_file}')
    fullchain = open(fullchain_file).read()
    privkey = open(privkey_file).read()

    client = boto3.client('ssm')
    fullchain_parameter = parameter_prefix + '/proxyCertificate'
    privkey_parameter = parameter_prefix + '/proxyPrivateKey'
    print(f'Uploading to {fullchain_parameter}')
    client.put_parameter(Name=fullchain_parameter, Value=fullchain, Type='String', Overwrite=True, Tier='Intelligent-Tiering')
    print(f'Uploading to {privkey_parameter}')
    client.put_parameter(Name=parameter_prefix + '/proxyPrivateKey', Value=privkey, Type='SecureString', Overwrite=True, Tier='Intelligent-Tiering')


try:
    domain = os.environ['CERTBOT_DOMAIN']
    if domain.endswith('.'):
        domain = domain[:-1]
    parameter_prefix = os.environ['ENVIRONMENT_PARAMETER_PREFIX']
    use_staging = os.environ.get('CERTBOT_PRODUCTION') != 'yes'
    print(f'Obtaining certificate for {domain}')
    obtain_certs(domain, use_staging)
    upload_certs(domain, parameter_prefix)
    print('Done')

except Exception as e:
    print(f'Failed to update certificate: {str(e)}')
    sns = boto3.client('sns')
    sns.publish(
        TopicArn=os.environ['SNS_TOPIC_ARN'],
        Message=json.dumps({
            'AlarmName': "Luovutuspalvelu certificate update failed",
            'NewStateValue': 'FAILURE',
            'NewStateReason': 'Certbot failed with exception',
            'AlarmDescription': 'Failed to renew Luovutuspalvelu SSL certificate: ' + str(e)
        }),
    )
