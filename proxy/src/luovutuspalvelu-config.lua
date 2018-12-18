local cjson = require "cjson"
local iputils = require "iputils"

local config_filename = "/etc/nginx/koski-luovutuspalvelu-proxy-config.json"
local f = io.open(config_filename, "r")
local content = f:read("*a")
f:close()

local mymodule = cjson.decode(content)

for _, c in ipairs(mymodule.clientList) do
  c.ipsParsed = iputils.parse_cidrs(c.ips)
end

mymodule.clientAuthorizations = {}
for user, password in pairs(mymodule.passwords) do
  mymodule.clientAuthorizations[user] = ngx.encode_base64(user .. ":" .. password)
end

return mymodule
