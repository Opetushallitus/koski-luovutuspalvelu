
import os
import boto3
import json

parameter_prefix = os.environ['ENVIRONMENT_PARAMETER_PREFIX']
client = boto3.client('ssm')

def requiredParameter(name):
    full_name = parameter_prefix + name
    try:
        res = client.get_parameter(Name=full_name, WithDecryption=True)
        return res['Parameter']['Value']
    except:
        print 'Getting parameter failed', full_name
        raise

def getParametersByPath(path):
    full_path = parameter_prefix + path
    paginator = client.get_paginator('get_parameters_by_path')
    pages = paginator.paginate(Path=full_path, WithDecryption=True, MaxResults=1)
    res = {}
    for page in pages:
        for param in page['Parameters']:
            res[param['Name'][len(full_path):]] = param['Value']
    return res

config = {
    'proxyCertificate': requiredParameter('/proxyCertificate'),
    'proxyPrivateKey': requiredParameter('/proxyPrivateKey'),
    'koskiUrl': requiredParameter('/koskiUrl')
}

extraCaCertificatesDict = getParametersByPath('/extraCaCertificates')
config['extraCaCertificates'] = extraCaCertificatesDict.values()

clientListString = requiredParameter('/clientList')
try:
    config['clientList'] = json.loads(clientListString)
except:
    print 'Parsing /clientList failed'
    raise

xroadClientsString = requiredParameter('/xroadClients')
try:
    config['xroadClients'] = json.loads(xroadClientsString)
except:
    print 'Parsing /xroadClients failed'
    raise

try:
    config['passwords'] = getParametersByPath('/passwords/')
except:
    print 'Parsing /passwords failed'
    raise

json.dump(config, open('/etc/nginx/koski-luovutuspalvelu-proxy-config.json', 'w'), indent=2)
