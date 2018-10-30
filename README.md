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

Proxy on toteutettu Docker-konttina, joka hakee käynnistyessä konfiguraation
AWS Parameter Storesta, muodostaa sen perusteella Nginxin konfiguraatiotiedostot,
ja käynnistää Nginxin.

Koska TLS-yhteys terminoidaan Nginxiin (eikä AWS:n load balanceriin,
joka ei tällä hetkellä tue client certificateja), proxy tarvitsee
sertifikaatin ja private keyn DNS-nimelleen. Tätä varten
Certbot-komponentti hakee sertifikaatin Let's Encryptistä ja tallettaa
sen (ja private keyn) AWS Parameter Storeen. Certbot on myöskin
Docker-kontti, joka ajetaan ajastetusti parin kuukauden välein.

## Proxyn buildi ja ajaminen

Minimissään tarvitset nämä:

 * Docker
 * Node.js (testattu versiolla 8.x)
 * openssl komentorivityökalun (tulee yleensä mukana OSX:ssä/Linuxissa)

Docker-imagen buildaus ja testien ajo paikallisesti:

    cd proxy
    npm run local
    # eri terminaali-ikkunassa:
    npm run test

Joskus voi olla hyödyllistä katsoa shellistä mitä ajossa olevassa kontissa tapahtuu:

    npm run shell

Skriptin get-config-from-aws.py testaus vaatii pääsyn oph-koski-dev AWS-ympäristön
(ohjeet koski-aws-infra/README.md tiedostossa):

    npm run test-aws-config-dev

## Certbotin buildi ja ajaminen

Certbot ottaa yhteyttä Let's Encrypt CA:han ja tallettaa tulokset
AWS:ään, joten sen testaaminen paikallisesti on hieman
monimutkaisempaa.

Docker-imagen saa buildattua helposti:

    cd certbot
    ./scripts/build.sh

Hae sertifikaatti Let's Encryptin Staging-ympäristöstä (ei siis
tuotantosertifikaatti, tällä vältetään Let's Encryptin rate limitit)
ja talleta se oph-koski-dev AWS-ympäristön "/local-certbot-test" polkuun
(eri kuin dev-ympäristössä normaalisti käytetty polku):

    ./scripts/run-locally-against-dev.sh

## Linkkejä

Tarkemmat ylläpito-ohjeet löytyvät koski-env/documentation/ kansiosta.

Travis CI: https://travis-ci.org/Opetushallitus/koski-luovutuspalvelu
