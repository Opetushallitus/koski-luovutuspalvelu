import json
import base64
from jinja2 import Environment, FileSystemLoader

config = json.load(open('/etc/nginx/koski-luovutuspalvelu-proxy-config.json'))

jinja2_environment = Environment(loader = FileSystemLoader('/etc/nginx'))
jinja2_environment.filters['b64encode'] = base64.b64encode

template = jinja2_environment.get_template('nginx.conf.j2')
open('/etc/nginx/nginx.conf', 'w').write(template.render(config))

template2 = jinja2_environment.get_template('passwords.conf.j2')
open('/etc/nginx/passwords.conf', 'w').write(template2.render(config))
