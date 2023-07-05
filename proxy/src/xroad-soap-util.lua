local xml2lua = require "xml2lua"
local tree = require "tree"

local mymodule = {}

function mymodule.remove_namespace_prefixes(table)
  local copy = {}
  for k, v in pairs(table) do
    local new_k = string.gsub(k, "(.-):", "")
    copy[new_k] = type(v) == "table" and mymodule.remove_namespace_prefixes(v) or v
  end
  return copy
end

function mymodule.parse_xroad_client_id(req_body)
  local handler = tree:new()
  local parser = xml2lua.parser(handler)
  parser:parse(req_body)
  local root = mymodule.remove_namespace_prefixes(handler.root)
  local client = root.Envelope.Header.client
  -- In some cases the xml2lua parser outputs a different value for the client parameters depending if namespace attributes are included or excluded from the client attributes.
  if type(client.xRoadInstance) == "table" and type(client.memberClass) == "table" and type(client.memberCode) == "table" and type(client.subsystemCode) == "table" then
    local id = client._attr['objectType'] .. ":" .. client.xRoadInstance['1'] .. "/" .. client.memberClass['1'] .. "/" .. client.memberCode['1'] .. "/" .. client.subsystemCode['1']
    return id
  elseif type(client.xRoadInstance) == "string" and type(client.memberClass) == "string" and type(client.memberCode) == "string" and type(client.subsystemCode) == "string" then
    local id = client._attr['objectType'] .. ":" .. client.xRoadInstance .. "/" .. client.memberClass .. "/" .. client.memberCode .. "/" .. client.subsystemCode
    return id
  else
    error("Invalid structure in 'root.Envelope.Header.client'. Tried to assume either table or string type for client parameters. Please check the SOAP request.")
  end
end

return mymodule
