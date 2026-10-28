# Offene Punkte – HYO Anamnese & Erstbericht

Stand: 28.10.2026. Gepflegt in `tools/offene_punkte.py`; dieselbe Liste steht im Excel (Blatt „Offene Punkte“).

## Vor Go-live (20)

| Nr. | Bereich | Offener Punkt | Wo | Wer |
| --- | --- | --- | --- | --- |
| 1 | Fachlich | Regel für genau 1× Ja im telefonischen Aspirationscheck festlegen (Vorschlag: mittleres Risiko, FEES-Entscheidung nach KSU mit Corinna) | DYSPH-S1, SOP FEES 6.1 | Corinna, Max |
| 2 | Fachlich | Fachliche Freigabe aller Datenfeld-Verzeichnisse (alle Module stehen auf ‚Entwurf zur fachlichen Freigabe‘) | Excel, alle Module | Corinna |
| 3 | Fachlich | BIAS A&R: Untertest-Zuordnung, Maximalwerte und Einstufungsgrenzen mit dem Durchführungsbuch abgleichen | BI-07 bis BI-19 | Fachliche Leitung |
| 4 | Fachlich | BoDyS: Formel für den Gesamtschweregrad hinterlegen (Verlagssoftware nicht verfügbar) und Kürzel der Stimmskalen vom Bogen übernehmen | BD-06 bis BD-08, BD-14 | Max |
| 11 | Fachlich | Freigabe-Regel bei FEES (Teambesprechung ab PAS 5, Gegenzeichnung bei FEDSS 5–6/Strukturbefund) in Langdock abbilden | FE-53, Freigabe-Knoten | Corinna, Max |
| 12 | Lizenzen | Testmaterial und Lizenzen beschaffen bzw. prüfen: BIAS (NAT-Verlag), BoDyS (Hogrefe), CPIB-10, CETI, VHI-12, SAQOL-39g, EAT-10, GUSS-Bogen; MoCA-Zertifizierung | Screening-Module | Max |
| 14 | tinana | Sandbox-Zugang: Endpunkte, Feldnamen und Authentifizierung für Patient:in und Verordnung (READ) eintragen; danach TESTMODUS = false | langdock/2_code_tinana_lesen.js (MAPPING) | tinana, Max |
| 15 | tinana | WRITE: Endpunkt, Feldnamen und Ablagekategorien (Befunde, Arztkorrespondenz) für die PDFs | HTTP-Knoten tinana_befund / tinana_arzt | tinana, Max |
| 17 | tinana | Versand der Arztrückmeldung per KIM aus tinana (Backoffice, manuell) als Ablauf festlegen | Benachrichtigung backoffice | Max |
| 18 | Langdock | Workflow in Langdock anlegen und mit allen sechs Testfällen durchlaufen (lokal getestet, in Langdock noch nicht) | langdock/testfaelle | Max |
| 19 | Langdock | Agent-Texte fachlich prüfen – je Modul ein Testlauf, insbesondere: erfindet der Agent nichts, stimmen Scores und Empfehlungen? | 3_agent_anweisung.md | Corinna |
| 20 | Langdock | Webhook aus dem Browser (CORS) klären – sonst bleibt der Umweg mit Secret in der URL | Formular ‚An Langdock senden‘ | Langdock |
| 21 | Langdock | Aufbewahrungsdauer der Workflow-Läufe (enthalten Gesundheitsdaten) klären und kürzen | Workflow-Einstellungen | Langdock, Max |
| 23 | Langdock | tinana-API-Schlüssel sicher hinterlegen statt im Code | 2_code_tinana_lesen.js | Langdock, Max |
| 24 | Datenschutz | AV-Verträge mit Langdock und tinana inkl. Verschwiegenheitsverpflichtung (§ 203 StGB) | – | Max, Anwalt Michael |
| 25 | Datenschutz | Verarbeitungsverzeichnis, TOMs und Datenschutz-Folgenabschätzung um Formular und Workflow ergänzen | – | Max, DSB |
| 26 | Datenschutz | Einwilligungstexte für Audio-/Video-/Fotoaufnahmen an das neue Feld MV-49 anpassen (Vertragspaket beim Anwalt) | MV-49 | Anwalt Michael |
| 27 | Betrieb | Formular nicht über öffentliches GitHub Pages mit echten Daten nutzen: per Jamf als lokale Datei auf die Raum-Laptops verteilen oder hinter Login hosten | index.html | Max, netgeo |
| 28 | Betrieb | Langdock-Verbindung (Webhook-URL und Secret) auf jedem Raum-Laptop einrichten | Formular ⚙ | Max |
| 30 | Branding | Quicksand als CI-Schrift bestätigen, Fußzeile und Praxisangaben im PDF prüfen | tools/pdf_node_template.js | Max, Rilana |

## Laufend (1)

| Nr. | Bereich | Offener Punkt | Wo | Wer |
| --- | --- | --- | --- | --- |
| 13 | Lizenzen | Keine 1:1-Digitalisierung der Protokollbögen ohne Zustimmung der Verlage (BIAS, BoDyS) – nur Ergebniswerte erfassen | BI-, BD-Felder | Max |

## Später (11)

| Nr. | Bereich | Offener Punkt | Wo | Wer |
| --- | --- | --- | --- | --- |
| 5 | Fachlich | KommPaS: klären, ab wann nutzbar; bis dahin nur Einschätzung VT-01 | VT-02, VT-03, DYSAR-S2 | Fachliche Leitung |
| 6 | Fachlich | Kognitive Kommunikationsstörung: Verlaufsinstrument festlegen (KKS-O1 offen); MoCA nur mit Zertifizierung | Screening KKS | Fachliche Leitung |
| 7 | Fachlich | Module ohne spezifisches Assessment: Sprechapraxie (HWL/DIAS), kognitive Kommunikationsstörung, Fazialisparese, Kinder (SP1–SP3, Kinder-Dysphagie) | MV-06, Screening | Fachliche Leitung |
| 8 | Fachlich | Dysphagie hat keinen Block ‚Zwischenbewertung‘ wie die anderen Module (GAS, Wiederholung GUSS/FEES, Entscheidung) | Modul DYSPH | Fachliche Leitung |
| 9 | Fachlich | Red Flags je Störungsbild in den allgemeinen Teil übernehmen (dann entfallen MA-13 und DP-05) | MA-13, DP-05 | Max, Corinna |
| 10 | Fachlich | Aktualität des ärztlichen Kehlkopfbefunds definieren (wie alt darf DP-02 sein?) | DP-02 | Fachliche Leitung |
| 16 | tinana | Rohdaten (JSON) zusätzlich zu PDFs übermitteln – Voraussetzung für Verläufe (FEES später, Zwischenbewertungen, Messzeitpunkte) | Export ‚felder‘ | tinana |
| 22 | Langdock | Freigaben gezielt an Personen senden (z. B. Fachliche Leitung nur bei FEES) – Empfängerliste gilt sonst für den ganzen Workflow | Freigabe-Knoten | Langdock |
| 29 | Betrieb | Terminart für FEES an einem eigenen Termin ergänzen (bisher: Ersttermin + ‚JSON laden‘) | VO-25 | Max |
| 31 | Branding | Unterschrift im PDF mit vollem Namen statt Kürzel (Zuordnung Kürzel → Name) | VO-24, PDF | Max |
| 32 | Dokumentation | Älteres Google-/Claude-Dokument ‚HYO Health – Anamnesebogen‘ und der Logikbaum vom 23.10. sind veraltet – Excel ist die Quelle | Doc vom 23.10.2026 | Max |
