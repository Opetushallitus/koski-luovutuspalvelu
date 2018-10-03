# Koski luovutuspalvelu

Luovutuspalvelu toimii proxynäviranomaisten järjestelmien ja Kosken
välillä.  Sen tehtävä on autentikoida viranomaisten API-kutsut
varmenteella (client certificate) ja rajata pyynnöt tiettyihin
IP-osoitteisiin.

<pre>
 +--------------+                   +--------------+    +-----------------+                   +------------+    +------------------+
 |              |+                  |     AWS      |    |      Koski      |                   |   Koski    |    |      Koski       |+
 | viranomainen +--- - - - - - - -->+ Network Load +--->+ luovutuspalvelu +--- - - - - - - -->+  haproxy   +----+ sovelluspalvelin ||
 |              ||    HTTPS w/      |   Balancer   |    |  proxy (Nginx)  |   HTTPS +         | (Cybercom) |    |    (Cybercom)    ||
 +--------------+|    client cert   +--------------+    +--------+--------+   basic auth      +------------+    +------------------+|
  +--------------+                   (kiinteät IP:t)             |                                               +------------------+
                                                                 |
                                                           +-----+-----+
                                                           |    AWS    |   Luovutuspalvelun konfiguraatio
                                                           | Parameter |   (mm. sallitut viranomaisten varmenteet ja IPt,
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
