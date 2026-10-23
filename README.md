# HYO Health – Ersttermin-Anamnese (Demo)

Schlanke Web-App für den logopädischen Ersttermin: Basisanamnese (Abschnitte 1–4) plus spezifisches Assessment je Diagnosegruppe. In dieser Demo ist das Assessment für **SC (Kau- und Schluckstörungen)** hinterlegt: Dysphagie- und TK-Anamnese, KSU, Trachealkanülen-Befund, GUSS mit Abbruchregel und Auswertung, Kostform-Empfehlung, Abschluss.

Eine einzige HTML-Datei, kein Server, keine Abhängigkeiten im Browser. Eingaben bleiben im Browser und werden weder gespeichert noch übertragen.

## Funktionen

- Diagnosegruppe oben wählen; bei SC wird die Verdachtsdiagnose Dysphagie (MV-06) ergänzt und die Blöcke 5–7 erscheinen
- Alle Anzeige-Bedingungen aus dem Excel (z. B. TK-Felder nur bei DA-08 = JA, GUSS-Teile nur bis zum Abbruch)
- Berechnete Felder: GUSS-Teilsummen, Gesamtwert, Schweregrad, BODS-Summe; Kostform-Vorschlag aus der GUSS-Auswertung
- Screening-Tabelle je aktivem Modul, Scores aus GUSS/TK-Befund automatisch übernommen
- Pflichtfeld- und Formatprüfung (Regex, Wertebereiche)
- Export als JSON mit den technischen Schlüsseln (z. B. für tinana/Langdock)
- Beispielfall SC (Werte aus der Spalte „Beispielwert“), Druckansicht, Hell/Dunkel-Modus

## Aufbau

```
data/HYO_Anamnese_Datenfelder.xlsx   Quelle: Felder, Wertelisten, Module, GUSS-Auswertung
tools/template.html                  Oberfläche und Logik
tools/build.py                       erzeugt index.html aus Excel + Template
index.html                           fertige App (generiert)
.github/workflows/pages.yml          baut und veröffentlicht bei jedem Push auf main
```

Felder ändern = Excel bearbeiten, dann neu bauen. Das Build-Skript bricht ab, wenn eine Bedingung nicht lesbar ist oder eine Werteliste fehlt.

```bash
pip install openpyxl
python3 tools/build.py
```

Lokal ansehen: `index.html` direkt im Browser öffnen.

## Auf GitHub Pages veröffentlichen

1. Neues Repository anlegen und diesen Ordner hochladen (oder `git init`, `git add .`, `git commit`, `git push`).
2. Im Repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Auf `main` pushen. Der Workflow baut `index.html` aus dem Excel und veröffentlicht sie; die URL steht danach unter Settings → Pages.

Ohne Actions geht es auch: Source „Deploy from a branch“, Branch `main`, Ordner `/ (root)`. Dann wird die eingecheckte `index.html` ausgeliefert – nach Änderungen am Excel lokal neu bauen und mit pushen.

## Datenschutz

GitHub-Pages-Seiten sind öffentlich erreichbar. Die App selbst enthält keine Patientendaten und sendet nichts, trotzdem gilt: Demo – keine echten Patientendaten eingeben. Für den Praxisbetrieb gehört die Erfassung in die Therapy Engine bzw. das PVS.
