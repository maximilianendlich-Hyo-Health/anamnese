// Langdock-Workflow „Ersttermin“ – Code-Knoten „tinana_lesen“ (Sprache: JavaScript)
// Holt Stammdaten und die aktuelle Verordnung aus tinana (READ-API, Pull) und
// gleicht sie mit den Formulardaten ab. Die Stammdaten gehen NUR an den PDF-Knoten,
// nicht an den Agenten: Der Agent arbeitet weiter pseudonymisiert mit der tinana-ID.
//
// Solange die tinana-Sandbox nicht steht: TESTMODUS = true liefert einen fiktiven
// Testpatienten. Pfade und Feldnamen unten (MAPPING) an die tinana-API-Doku anpassen.

const TESTMODUS = true;
const TINANA_BASIS_URL = "https://PLATZHALTER.tinana.de/api/v1";   // aus der tinana-Doku
const TINANA_API_KEY = "";                                         // sicher hinterlegen, siehe Anleitung

const id = eingang.output.patient_id;

async function holen(pfad) {
  const r = await ld.request({
    method: "GET",
    url: TINANA_BASIS_URL + pfad,
    headers: { Authorization: `Bearer ${TINANA_API_KEY}`, Accept: "application/json" },
  });
  if (r.status === 404) throw new Error(`tinana kennt die ID ${id} nicht (404). tinana-ID im Formular prüfen.`);
  if (r.status >= 300) throw new Error(`tinana ${pfad}: Status ${r.status}`);
  return r.json;
}

let patient, vo;
if (TESTMODUS) {
  patient = { last_name: "Muster", first_name: "Erika", birth_date: "1948-03-12", street: "Musterstraße 5", zip: "10245", city: "Berlin", insurance_name: "AOK Nordost", insurance_number: "A123456789" };
  vo = { physician_name: "Dr. M. Beispiel, Neurologie", bsnr: "721234500", lanr: "123456701", icd10: ["I63.5"], diagnosis_group: eingang.output.diagnosegruppe || "SC", lead_symptom: "a", issued_at: "2026-10-15", remedy: "Schlucktherapie-45", units: 10, frequency: "2x wöchentlich" };
} else {
  // ---------- MAPPING: Pfade an die tinana-API anpassen ----------
  patient = await holen(`/patients/${encodeURIComponent(id)}`);
  const liste = await holen(`/patients/${encodeURIComponent(id)}/prescriptions?status=active`);
  const items = Array.isArray(liste) ? liste : (liste.items || []);
  vo = items.sort((a, b) => String(b.issued_at || "").localeCompare(String(a.issued_at || "")))[0] || {};
}

// ---------- MAPPING: Feldnamen an die tinana-API anpassen ----------
const stammdaten = {
  name: [patient.last_name, patient.first_name].filter(Boolean).join(", "),
  geburtsdatum: patient.birth_date || null,
  adresse: [patient.street, [patient.zip, patient.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
  krankenkasse: patient.insurance_name || null,
  versichertennr: patient.insurance_number || null,
};
const verordnung = {
  arzt: vo.physician_name || null,
  bsnr: vo.bsnr || null,
  lanr: vo.lanr || null,
  icd10: Array.isArray(vo.icd10) ? vo.icd10 : (vo.icd10 ? [vo.icd10] : []),
  diagnosegruppe: vo.diagnosis_group || null,
  leitsymptomatik: vo.lead_symptom || null,
  ausgestellt_am: vo.issued_at || null,
  heilmittel: vo.remedy || null,
  menge: vo.units ?? null,
  frequenz: vo.frequency || null,
};

// Abgleich Formular ↔ tinana (landet in den Prüfhinweisen der Freigabe)
const abgleich = [];
if (!stammdaten.name) abgleich.push("tinana liefert keinen Namen zur ID.");
if (!verordnung.diagnosegruppe) abgleich.push("In tinana ist keine aktive Verordnung hinterlegt.");
else if (eingang.output.diagnosegruppe && verordnung.diagnosegruppe !== eingang.output.diagnosegruppe)
  abgleich.push(`Diagnosegruppe im Formular (${eingang.output.diagnosegruppe}) weicht von der Verordnung in tinana (${verordnung.diagnosegruppe}) ab.`);

return { testmodus: TESTMODUS, stammdaten, verordnung, abgleich };
