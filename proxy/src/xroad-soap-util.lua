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
  print(client)
  local id = client._attr['objectType'] .. ":" .. client.xRoadInstance .. "/" .. client.memberClass .. "/" .. client.memberCode .. "/" .. client.subsystemCode
  return id
end

return mymodule
