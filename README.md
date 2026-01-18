# Kleuterwinkel

Een mobile first appje voor jouw klaswinkel.

## Wat kan dit nu al

1. De app start direct in de winkel, alles gebeurt in 1 scherm
2. Scannen in het scanvenster, de handscanner is een grote knop in het venster
3. Na een scan zie je het product met foto en prijs
4. Met In mandje voeg je toe, daarna springt het scherm terug naar de scanner
5. Mandje toont alle items, plus totaalbedrag
6. Betalen met de geld knop, succesmelding, daarna is alles leeg en je blijft in de winkel
7. Docentenmodus via lang indrukken op de titelbalk

## Scannen

De app gebruikt waar mogelijk de BarcodeDetector API.
Als jouw iPad dit niet ondersteunt, dan gebruikt de app jsQR als fallback, zodat live scannen toch werkt.

Let op, camera werkt alleen via https of via localhost. Open je het bestand direct via bestand openen, dan kan de camera blokkeren.

## Docentenmodus

Stappen

1. Houd de titelbalk even vast
2. Pincode is standaard 1234
3. Voeg producten toe, pas prijzen aan, upload een foto

## Runnen

Dit is een statische webapp.

Handig voor lokaal testen met camera, start een simpele server.

```bash
python3 -m http.server 5173
```

Open daarna http://localhost:5173

Tip als je eerder een oude versie op iPad hebt geopend: verwijder de site data van GitHub Pages of herlaad hard, omdat de app een service worker cache gebruikt.

## GitHub Pages

1. Zet de map op GitHub
2. Ga naar Settings, Pages
3. Deploy from branch, kies main en root
