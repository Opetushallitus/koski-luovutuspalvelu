# Koski luovutuspalvelu

Luovutuspalvelu toimii proxynä viranomaisten järjestelmien ja Kosken
välillä.  Sen tehtävä on autentikoida viranomaisten API-kutsut
varmenteella (client certificate) ja rajata pyynnöt tiettyihin
IP-osoitteisiin.

Kosken suuntaan proxy lisää pyyntöön kyseisen viranomaisen
palvelukäyttäjän käyttäjätunnuksen/salasanan (viranomainen ei siis
itse tiedä tätä salasanaa).

Proxyllä on myös kiinteät IP-osoitteet, jotta viranomainen voi omassa
järjestelmässään helpommin rajata ulosmenevää liikennettä.

<pre>
+--------------+                 +-------------+   +-----------------+               +------------+   +------------------+
|              |+                | AWS Network |   |      Koski      |               |   Koski    |   |      Koski       |+
| viranomainen +--- - - - - - -->+    Load     +-->+ luovutuspalvelu +-- - - - - - ->+  haproxy   +---+ sovelluspalvelin ||
|              ||  HTTPS +       |  Balancer   |   |  proxy (Nginx)  |  HTTPS +      | (Cybercom) |   |    (Cybercom)    ||
+--------------+|  client cert   +-------------+   +--------+--------+  basic auth   +------------+   +------------------+|
 +--------------+                 (kiinteät IP:)            |                                          +------------------+
                                                            |
                                                      +-----+-----+
                                                      |    AWS    |   Luovutuspalvelun konfiguraatio
                                                      | Parameter |   (mm. sallitut viranomaisten varmenteet ja IP:t,
                                                      |   Store   |   palvelimen varmenne ja private key)
                                                      +-----+-----+
                                                            ^
                                                            |
                                                   +--------+--------+
                                                   |      Koski      |         +------------------+
                                                   | luovutuspalvelu +- - - -->+ Let's Encrypt CA |
                                                   |     certbot     |         +------------------+
                                                   +-----------------+
</pre>

# Linkkejä

Travis CI: https://travis-ci.org/Opetushallitus/koski-luovutuspalvelu
