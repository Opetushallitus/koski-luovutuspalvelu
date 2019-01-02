# Koski luovutuspalvelu

Luovutuspalvelu toimii proxynä Kosken ja viranomaisten järjestelmien tai
palveluväylän liityntäpalvelimen välillä. Sen tehtävä on autentikoida
sisääntulevat API-kutsut (viranomaiselta tai liityntäpalvelimelta)
varmenteella (client certificate) ja rajata pyynnöt tiettyihin
IP-osoitteisiin. 

Kosken suuntaan proxy lisää pyyntöön oikean tahon palvelukäyttäjän käyttäjätunnuksen
ja salasanan (jotka löytyvät proxyn konffeista - kutsuja ei siis itse tiedä niitä):

* Palveluväylän tapauksessa proxy parsii sisääntulevasta SOAP-pyynnöstä X-Road
  `<client>` elementin, ja valitsee oikean palvelukäyttäjän kutsujan tunnisteen 
  (esim. `SUBSYSTEM:FI.GOV.12345-6.ConsumerService`) perusteella.
* Muussa tapauksessa palvelukäyttäjä valitaan varmenteen subject-nimen
  (esim. `CN=client.example.com,O=Testi,C=FI`) perusteella. 

Koskelle kutsu näkyy normaalina HTTP basic authentication API-kutsuna, eikä
Kosken tarvitse tietää mitään client certificateista, IP-rajauksista tai
palveluväylän clienteistä. HTTP-pyynnön ja vastauksen body (yleensä JSON tai SOAP)
proxytetään sellaisenaan.

Proxyllä on myös kiinteät IP-osoitteet, jotta viranomainen voi omassa
järjestelmässään helpommin rajata ulosmenevää liikennettä.

<pre>
+--------------+                 +-------------+   +-----------------+               +------------+   +------------------+
|              |+                | AWS Network |   |      Koski      |               |   Koski    |   |      Koski       |+
| viranomainen +--+ - - - - - -->+    Load     +-->+ luovutuspalvelu +-- - - - - - ->+  haproxy   +---+ sovelluspalvelin ||
|              || |  HTTPS +     |  Balancer   |   |  proxy (Nginx)  |  HTTPS +      | (Cybercom) |   |    (Cybercom)    ||
+--------------+| |  client      +-------------+   +--------+--------+  basic auth   +------------+   +------------------+|
 +--------------+ |  certificate  (kiinteät IP:)            |                                          +------------------+
                  |                                         |
+--------------+  |                                   +-----+-----+
| palveluväylä |  |                                   |    AWS    |   Luovutuspalvelun konfiguraatio
|   liityntä-  +--+                                   | Parameter |   (mm. sallitut viranomaisten varmenteet ja IP:t,
|   palvelin   |                                      |   Store   |   palvelimen varmenne ja private key)
+--------------+                                      +-----+-----+
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
sen (ja private keyn) AWS Parameter Storeen. Oikeus domainiin validoidaan
tekemällä muutos DNS:ään (Route53). Certbot on myöskin
Docker-kontti, joka ajetaan ajastetusti parin kuukauden välein.

## Proxyn buildi ja ajaminen

Minimissään tarvitset nämä:

 * Docker
 * Node.js (uusin 8.x sarjan + sen mukana tuleva NPM-versio)
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
