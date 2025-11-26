# garage84

Broneerimissüsteem koolile, kus saab klassiruume (jm ruume) broneerida ning vaadata nende ajagraafikut. Kavandatud algselt MURG-ile, mis kasutas enne Exceli rägastikku ruumide haldamiseks.

Eesmärk oleks võimalikult lihtne ja kiire broneerimisüsteem (TalTechi laadne) valmis teha.

## Tehnoloogiad

**Frontend:** HTML, CSS ja JavaScript (Vite + Bun).\\
**Backend:** Firebase (Authentication, Firestore) ja Cloudflare R2 (Image upload).

## Kuidas arendada

Sisuliselt peaks olema Windowsis samad käsud. Lae kindlasti alla [Git](https://git-scm.com/) ja [Bun](https://bun.com/).

1. Klooni see repo:

```bash
git clone https://gitlab.cs.taltech.ee/henria/ITI0105-2025.git
cd ITI0105-2025
```

2. Lae alla [Bun](https://bun.com/) ning paigalda projekt:

```bash
bun i -D
```

3. Käivita server:

```bash
bun dev
```

4. Ava brauseris [http://localhost:3000](http://localhost:3000)

Lokaalset ega test andmebaasi pole veel seadistatud, kuna `prod` veebileht pole veel üleval. `Wrangler`-iga saab imiteerida Cloudflare R2 vajadusel.

## Kuidas buildida

```bash
bun build
```

Peaks olema dist kaustas. GitLab Pages liigutab selle automaatselt public kausta, kus on ka assetid.

## Projektiplaan

Kiire ja mugav koolimaja ruumide broneerimise süsteem õpetajatele. Loome veebilehe, mis võimaldab õpetajatel leida ja broneerida parasjagu vaba klassiruumi vestlusteks, konsultatsioonideks või muudeks kohtumisteks. Veebileht töötab koos olemasoleva Exceli-tüüpi tunniplaani või kalendrifailiga, mis määrab, millised ruumid on millisel ajaploki jooksul vabad/hõivatud. Kasutaja saab skännida QR-koodi, mis asub iga klassiruumi uksel ja õpetajate toas. QR-kood viib veebilehele. Valides vaba toa, saab kinnitada broneeringu. Broneering salvestatakse automaatselt ruumikalendrisse, nii et topeltbroneeringud on välistatud.

Rakendus on suunatud Mustamäe Riigigümnaasiumi õpetajatele. Vanus: 20+ aastased. Õpetajad on pühendunud õpilaste juhendamisele ning vajavad kiireid ja lihtsaid tööriistu igapäevasteks ülesanneteks. Nende huvid on kvaliteetne õpetamine, individuaalsed vestlused õpilastega ja aja säästmine. Rakendust on vaja, sest praegu on vaba ruumi leidmine keerukas ja aeganõudev – Exceli tabel ei sobi kiireks mobiilikasutuseks. Uus lahendus aitab nutitelefoniga QR-koodi abil mõne sekundiga leida ja broneerida vaba ruumi, vältides topeltbroneeringuid ning muutes töökorralduse sujuvamaks.

Lingid sarnastele veebilehtedele:

[TalTechi raamatukogu rühma- ja individuaaltööruumide reserveerimine](https://ws.lib.ttu.ee/ikiosk/Reserve)

[Ülemiste city ruumide broneerimine](https://konverents.ulemistecity.ee/)

[Studio Mind Z ruumide broneerimine](https://www.mindz.ee/broneeri)

Meie projekt erineb teistest veebilehtedest, sest broneering on mõeldud spetsiifilisele koolile ning selle kooli õpetajatele. Samuti on olemas ruumide ustel QR-koodid, mis viivad veebilehele.

[Link Figma projektile](https://www.figma.com/files/team/1554450668308714767/all-projects?fuid=1554899397867533876)

## Funktsioonid

- Töötav ruumide süsteem koos andmebaasiga (Firebase) ning pildi üleslaadimisega (Cloudflare R2)
- Autentimine (Firebase)
- Responsiivne rakendus
- QR koodide genereerimine ning skaneerimine

## Tulevikuplaanid

- Broneerimissüsteem back-end
- Stiili täiustamine ja UX parandamine
- Võib-olla SSO sisselogimine vastavalt koolisüsteemidele

## Autorid

- Henri Johannes Aunin
- Hanna Kristiina Hiienõmm
- Marcus Borkmann

## LICENCE

[GPL 3.0](https://www.gnu.org/licenses/gpl-3.0.html)
