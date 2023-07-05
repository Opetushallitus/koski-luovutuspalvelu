local xml2lua = require "xml2lua"
local handler = require "tree"

local xml = [[
    <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
    <SOAP-ENV:Header>
        <xrd:client xmlns:xrd="http://x-road.eu/xsd/xroad.xsd" xmlns:id="http://x-road.eu/xsd/identifiers" id:objectType="SUBSYSTEM">
            <id:xRoadInstance xmlns:id="http://x-road.eu/xsd/identifiers">FI-TEST</id:xRoadInstance>
            <id:memberClass xmlns:id="http://x-road.eu/xsd/identifiers">GOV</id:memberClass>
            <id:memberCode xmlns:id="http://x-road.eu/xsd/identifiers">0245437-2</id:memberCode>
            <id:subsystemCode xmlns:id="http://x-road.eu/xsd/identifiers">ServiceViewClient</id:subsystemCode>
        </xrd:client>
        <xrd:service xmlns:xrd="http://x-road.eu/xsd/xroad.xsd" xmlns:id="http://x-road.eu/xsd/identifiers" id:objectType="SERVICE">
            <id:xRoadInstance xmlns:id="http://x-road.eu/xsd/identifiers">FI-TEST</id:xRoadInstance>
            <id:memberClass xmlns:id="http://x-road.eu/xsd/identifiers">GOV</id:memberClass>
            <id:memberCode xmlns:id="http://x-road.eu/xsd/identifiers">2769790-1</id:memberCode>
            <id:subsystemCode xmlns:id="http://x-road.eu/xsd/identifiers">koski</id:subsystemCode>
            <id:serviceCode xmlns:id="http://x-road.eu/xsd/identifiers">suomiFiRekisteritiedot</id:serviceCode>
            <id:serviceVersion xmlns:id="http://x-road.eu/xsd/identifiers">v1</id:serviceVersion>
        </xrd:service>
        <xrd:protocolVersion xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">4.0</xrd:protocolVersion>
        <xrd:userId xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">jdoe</xrd:userId>
        <xrd:id xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">38997cf6400edd85</xrd:id>
    </SOAP-ENV:Header>
    <SOAP-ENV:Body>
        <ns1:suomiFiRekisteritiedot xmlns:ns1="http://docs.koski-xroad.fi/producer">
            <ns1:hetu xmlns:ns1="http://docs.koski-xroad.fi/producer">210281-9988</ns1:hetu>
            <!-- <ns1:hetu>210281-9988</ns1:hetu> -->
            </ns1:suomiFiRekisteritiedot>
    </SOAP-ENV:Body>
  </SOAP-ENV:Envelope>
]]

local xml2 = [[
    <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Header>
      <xrd:client xmlns:xrd="http://x-road.eu/xsd/xroad.xsd" xmlns:id="http://x-road.eu/xsd/identifiers" id:objectType="SUBSYSTEM">
          <id:xRoadInstance>FI-TEST</id:xRoadInstance>
          <id:memberClass>GOV</id:memberClass>
          <id:memberCode>0245437-2</id:memberCode>
          <id:subsystemCode>ServiceViewClient</id:subsystemCode>
      </xrd:client>
      <xrd:service xmlns:xrd="http://x-road.eu/xsd/xroad.xsd" xmlns:id="http://x-road.eu/xsd/identifiers" id:objectType="SERVICE">
          <id:xRoadInstance>FI-TEST</id:xRoadInstance>
          <id:memberClass>GOV</id:memberClass>
          <id:memberCode>2769790-1</id:memberCode>
          <id:subsystemCode>koski</id:subsystemCode>
          <id:serviceCode>suomiFiRekisteritiedot</id:serviceCode>
          <id:serviceVersion>v1</id:serviceVersion>
      </xrd:service>
      <xrd:protocolVersion xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">4.0</xrd:protocolVersion>
      <xrd:userId xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">jdoe</xrd:userId>
      <xrd:id xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">38997cf6400edd85</xrd:id>
  </SOAP-ENV:Header>
  <SOAP-ENV:Body>
      <ns1:suomiFiRekisteritiedot xmlns:ns1="http://docs.koski-xroad.fi/producer">
          <ns1:hetu xmlns:ns1="http://docs.koski-xroad.fi/producer">210281-9988</ns1:hetu>
          <!-- <ns1:hetu>210281-9988</ns1:hetu> -->
          </ns1:suomiFiRekisteritiedot>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>
]]

-- Instantiates the XML parser
local parser = xml2lua.parser(handler)
parser:parse(xml)
--parser:parse(xml2)

function remove_namespace_prefixes(table)
    local copy = {}
    for k, v in pairs(table) do
      local new_k = string.gsub(k, "(.-):", "")
      copy[new_k] = type(v) == "table" and remove_namespace_prefixes(v) or v
    end
    return copy
  end

local data = remove_namespace_prefixes(handler.root)

print(data.Envelope.Header.client)
