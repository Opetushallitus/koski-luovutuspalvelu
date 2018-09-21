# based on https://github.com/rog2/certbot-lambda/blob/master/main.py

import os
import shutil
import boto3
import certbot.main

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
    fullchain_file = os.path.join(CERTBOT_DIR, 'live', domain, 'fullchain.pem')
    privkey_file = os.path.join(CERTBOT_DIR, 'live', domain, 'privkey.pem')
    print 'Reading', fullchain_file, 'and', privkey_file
    fullchain = open(fullchain_file).read()
    privkey = open(privkey_file).read()

    client = boto3.client('ssm')
    fullchain_parameter = parameter_prefix + '/proxyCertificate'
    privkey_parameter = parameter_prefix + '/proxyPrivateKey'
    print 'Uploading to', fullchain_parameter
    client.put_parameter(Name=fullchain_parameter, Value=fullchain, Type='String', Overwrite=True)
    print 'Uploading to', privkey_parameter
    client.put_parameter(Name=parameter_prefix + '/proxyPrivateKey', Value=privkey, Type='SecureString', Overwrite=True)
    
domain = os.environ['CERTBOT_DOMAIN']
if domain.endswith('.'):
    domain = domain[:-1]
parameter_prefix = os.environ['CERTBOT_PARAMETER_PREFIX']
use_staging = os.environ.get('CERTBOT_PRODUCTION') != 'yes'
print 'Obtaining certificate for', domain
obtain_certs(domain, use_staging)
upload_certs(domain, parameter_prefix)
print 'Done'
