import json
import base64
from jinja2 import Environment, FileSystemLoader

config = json.load(open('/etc/nginx/koski-luovutuspalvelu-proxy-config.json'))

config['clientListString'] = json.dumps(config['clientList'])

jinja2_environment = Environment(loader = FileSystemLoader('/etc/nginx'))
jinja2_environment.filters['b64encode'] = base64.b64encode

template = jinja2_environment.get_template('luovutuspalvelu-config.lua.j2')
open('/usr/local/openresty/site/lualib/luovutuspalvelu-config.lua', 'w').write(template.render(config))
