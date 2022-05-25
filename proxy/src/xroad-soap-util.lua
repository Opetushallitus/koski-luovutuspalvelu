local xml2lua = require "xml2lua"
local tree = require "tree"
local ngx = require "ngx"

local mymodule = {}

function mymodule.remove_namespace_prefixes(table)
  local copy = {}
  for k, v in pairs(table) do
    local new_k = string.gsub(k, "(.-):", "")
    copy[new_k] = type(v) == "table" and mymodule.remove_namespace_prefixes(v) or v
  end
  return copy
end

function mymodule.dump(o)
    if type(o) == 'table' then
        local s = '{ '
        for k,v in pairs(o) do
            if type(k) ~= 'number' then k = '"'..k..'"' end
            s = s .. '['..k..'] = ' .. mymodule.dump(v) .. ','
        end
        return s .. '} '
    else
        return tostring(o)
    end
end

function mymodule.parse_xroad_client_id(req_body)
  local handler = tree:new()
  local parser = xml2lua.parser(handler)
--  Do not enable this on production as hetu will be logged
  ngx.log(ngx.WARN, mymodule.dump(req_body))
  parser:parse(req_body)
  local root = mymodule.remove_namespace_prefixes(handler.root)
  local client = root.Envelope.Header.client
  ngx.log(ngx.WARN, mymodule.dump(client))
  local id = client._attr['objectType'] .. ":" .. client.xRoadInstance['1'] .. "/" .. client.memberClass['1'] .. "/" .. client.memberCode['1'] .. "/" .. client.subsystemCode['1']
  return id
end

return mymodule
