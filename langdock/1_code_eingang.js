// Langdock-Workflow „Ersttermin“ – Code-Knoten „eingang“ (Sprache: JavaScript)
// Liest die Formulardaten aus dem Webhook, erkennt die aktiven Module (Dysphagie, Aphasie,
// Dysarthrie, Myofunktion, Dysphonie), rechnet Kennwerte deterministisch nach und baut den
// Text für den Agenten. Der Agent rechnet keine Scores; „Auf einen Blick“ im PDF kommt von hier.

const out = trigger.output || {};
let p = out.body;
if (!p || typeof p !== "object" || !p.felder) {
  // Fallback: Formular hat ohne CORS gesendet (text/plain) → Rohtext parsen
  const raw = out.rawBody || (typeof out.body === "string" ? out.body : "");
  try { p = JSON.parse(raw); } catch (e) { throw new Error("Eingang ist kein gültiges JSON. 'Preserve raw request body' im Webhook aktivieren."); }
}
if (!p || !p.felder) throw new Error("Feld 'felder' fehlt im Eingang.");
if (!p.tinana_patient_id) throw new Error("tinana-Patienten-ID fehlt.");

const f = p.felder;
const lesbar = Array.isArray(p.lesbar) ? p.lesbar : [];
const txt = Object.fromEntries(lesbar.map(z => [z.id, z.wert]));          // Anzeige-Text je Feld-ID
const L = id => txt[id] ?? null;
const n = k => (f[k] === undefined || f[k] === null || f[k] === "" ? null : Number(String(f[k]).replace(",", ".")));
const arr = k => (Array.isArray(f[k]) ? f[k] : f[k] ? [f[k]] : []);
const sum = keys => (keys.every(k => n(k) !== null) ? keys.reduce((a, k) => a + n(k), 0) : null);
const zahl = (v, d = 1) => (v === null || v === undefined ? null : String(Math.round(v * 10 ** d) / 10 ** d).replace(".", ","));

const MODULNAME = { DYSPH: "Dysphagie", APH: "Aphasie", DYSAR: "Dysarthrie", MFS: "Myofunktion", DYSPHON: "Dysphonie" };
const module = arr("mv_vd").filter(c => MODULNAME[c]);
const verlauf = f.vo_terminart === "VERLAUF";
const warnungen = [], kennwerte = [], scoreZeilen = [];
const kw = (label, wert) => { if (wert !== null && wert !== undefined && wert !== "") { kennwerte.push({ label, wert: String(wert) }); scoreZeilen.push(`- ${label}: ${wert}`); } };

// ---------- Dysphagie ----------
let guss = null, gussGrad = null, abbruch = null, pasMax = null, fedss = null;
const fees = f.fe_durchgefuehrt === "ja";
if (module.includes("DYSPH")) {
  const teile = [
    ["Vorversuch", ["gu_vv_vigilanz", "gu_vv_husten", "gu_vv_speichel", "gu_vv_drooling", "gu_vv_stimme"]],
    ["breiig", ["gu_breiig_schluckakt", "gu_breiig_husten", "gu_breiig_drooling", "gu_breiig_stimme"]],
    ["flüssig", ["gu_fluessig_schluckakt", "gu_fluessig_husten", "gu_fluessig_drooling", "gu_fluessig_stimme"]],
    ["fest", ["gu_fest_schluckakt", "gu_fest_husten", "gu_fest_drooling", "gu_fest_stimme"]],
  ].map(([name, keys]) => ({ name, summe: sum(keys) }));
  if (f.gu_durchgefuehrt === "ja" && teile[0].summe !== null) {   // GUSS: Teil nur werten, wenn der vorige 5 Punkte hatte
    guss = 0;
    for (let i = 0; i < teile.length; i++) {
      if (i > 0 && teile[i - 1].summe !== 5) { abbruch = teile[i - 1].name; break; }
      if (teile[i].summe === null) { guss = null; break; }
      guss += teile[i].summe;
    }
  }
  gussGrad = guss === null ? null : guss === 20 ? "minimal/keine" : guss >= 15 ? "leichtgradig" : guss >= 10 ? "mittelgradig" : "hochgradig";
  if (guss !== null && n("gu_gesamt") !== null && n("gu_gesamt") !== guss) warnungen.push(`GUSS im Formular (${n("gu_gesamt")}) weicht von der Nachrechnung (${guss}) ab.`);
  const pas = ["fe_breiig_pas", "fe_fluessig_pas", "fe_fest_pas", "fe_tabl_pas"].map(n).filter(x => x !== null);
  pasMax = fees && pas.length ? Math.max(...pas) : null;
  if (fees && pasMax !== null && n("fe_pas_max") !== null && n("fe_pas_max") !== pasMax) warnungen.push(`PAS max im Formular (${n("fe_pas_max")}) weicht von der Nachrechnung (${pasMax}) ab.`);
  fedss = fees ? n("fe_fedss") : null;
  const eat = (p.screening || []).find(s => s.sc_instrument === "DYSPH-S4");
  kw("GUSS", guss === null ? null : `${guss} / 20 · ${gussGrad}${abbruch ? ", Abbruch nach " + abbruch : ""}`);
  if (fees) kw("PAS max · FEDSS", `${pasMax ?? "–"} / 8 · ${fedss ?? "–"} / 6`);
  kw("EAT-10", eat && eat.sc_score ? `${eat.sc_score} / 40` : null);
  kw("Kostform Speisen (IDDSI)", L("BE-01")); kw("Kostform Getränke (IDDSI)", L("BE-02")); kw("Beim Essen", L("BE-06"));
  if (n("tb_bods1") !== null && n("tb_bods2") !== null) kw("BODS", `${n("tb_bods1") + n("tb_bods2")} / 16`);
}
// ---------- Aphasie ----------
if (module.includes("APH")) {
  if (verlauf) { kw("Zielerreichung (GAS)", L("AZ-01")); kw("Fortschritt", L("AZ-04")); kw("Entscheidung", L("AZ-05")); kw("BIAS wiederholt", L("AZ-02")); }
  kw("BIAS – Schweregrad", L("BI-19")); kw("Leitsyndrom", L("BI-20"));
  if (f.al_verfahren === "CPIB") kw("CPIB-10", n("al_cpib_summe") === null ? null : `${n("al_cpib_summe")} / 30`);
  if (f.al_verfahren === "CETI") kw("CETI", n("al_ceti_gesamt") === null ? null : `${n("al_ceti_gesamt")} / 100`);
  kw("SAQOL-39g", zahl(n("al_saqol_gesamt")));
}
// ---------- Dysarthrie ----------
if (module.includes("DYSAR")) {
  const ausg = (akt, basis) => (akt === null ? null : basis === null ? akt : `${akt} (Ausgang ${basis})`);
  if (verlauf) {
    kw("Zielerreichung (GAS)", L("DZ-02")); kw("Fortschritt", L("DZ-08")); kw("Entscheidung", L("DZ-09"));
    kw("Verständlichkeit (1–6)", ausg(L("DZ-04"), L("VT-01")));
    kw("KommPaS", ausg(n("dz_kommpas") === null ? null : `${n("dz_kommpas")} %`, n("vt_kommpas") === null ? null : `${n("vt_kommpas")} %`));
    kw("CPIB-10", ausg(n("dz_cpib") === null ? null : `${n("dz_cpib")} / 30`, n("vt_cpib")));
    kw("AVQI", ausg(zahl(n("dz_avqi")), zahl(n("vt_avqi"))));
    kw("BoDyS-Vergleich", L("DZ-03"));
  } else {
    kw("BoDyS – Schweregrad", L("BD-17")); kw("BoDyS – Gesamtschweregrad", zahl(n("bd_gesamt"))); kw("Dysarthrieform", L("BD-16"));
    kw("Verständlichkeit (Logopäd:in, 1–6)", L("VT-01"));
    kw("KommPaS", n("vt_kommpas") === null ? null : `${n("vt_kommpas")} %`);
    kw("CPIB-10", n("vt_cpib") === null ? null : `${n("vt_cpib")} / 30`);
    kw("AVQI", zahl(n("vt_avqi")));
  }
}
// ---------- Myofunktion: Kernwert 0–14 nachrechnen ----------
if (module.includes("MFS")) {
  const P = { LIP: { KOMP: 0, ANGESTR: 1, WECHSELND: 1, INKOMP: 2, UNTERLIPPE: 2 }, ZUN: { PHYS: 0, MUNDBODEN: 1, ADDENT: 2, INTERDENT: 2, LATERAL: 2 },
    NAS: { OB: 0, ERSCHW: 1, NICHT: 2 }, HAB: { KEINE: 0, SELTEN: 1, NACHTS: 1, TAEGL: 2, DAUER: 2 } };
  const multi = (k, ok, worst) => { const v = arr(k); if (!v.length) return null; const o = v.filter(c => c !== ok); if (!o.length) return 0; if (worst && v.includes(worst)) return 2; return o.length === 1 ? 1 : 2; };
  const kern = (lip, zun, nas, sfl, sfe, kau, hab) => { const t = [P.LIP[f[lip]], P.ZUN[f[zun]], P.NAS[f[nas]], multi(sfl, "PHYS"), multi(sfe, "PHYS"), multi(kau, "OB", "VERMEID"), hab]; return t.some(x => x === undefined || x === null) ? null : t.reduce((a, b) => a + b, 0); };
  const habB = !arr("ma_habits").length ? null : arr("ma_habits").includes("KEINE") ? 0 : (P.HAB[f.ma_habit_haeuf] ?? null);
  const kB = kern("mb_lippenruhe", "mb_zungenruhe", "mb_nasenatmung", "mb_schluck_fl", "mb_schluck_fest", "mb_kauen", habB);
  if (kB !== null && n("mb_kernwert") !== null && n("mb_kernwert") !== kB) warnungen.push(`Myofunktions-Kernwert im Formular (${n("mb_kernwert")}) weicht von der Nachrechnung (${kB}) ab.`);
  if (verlauf) {
    const kZ = kern("mz_lippenruhe", "mz_zungenruhe", "mz_nasenatmung", "mz_schluck_fl", "mz_schluck_fest", "mz_kauen", P.HAB[f.mz_habits] ?? null);
    kw("Zielerreichung (GAS)", L("MZ-02")); kw("Kernwert aktuell", kZ === null ? null : `${kZ} / 14 (Ausgang ${kB ?? "–"})`); kw("Muster im Alltag", L("MZ-13")); kw("Entscheidung", L("MZ-15"));
  } else {
    kw("Myofunktions-Kernwert", kB === null ? null : `${kB} / 14 (hausintern, nicht normiert)`);
  }
  kw("Einordnung", L("MB-13")); kw("Nasenatmung", L("MB-05")); kw("Aussprache", L("MB-12"));
}
// ---------- Dysphonie ----------
if (module.includes("DYSPHON")) {
  if (verlauf) { kw("Zielerreichung (GAS)", L("PZ-02")); kw("Funktionsziel Ist · Ziel", n("pz_funkt_ist") === null ? null : `${zahl(n("pz_funkt_ist"))} · ${zahl(n("pe_funkt_ziel")) ?? "–"} (${L("PE-07") || "–"})`); kw("AVQI aktuell", zahl(n("pz_avqi"))); kw("Tonhaltedauer aktuell", n("pz_mpt") === null ? null : `${zahl(n("pz_mpt"))} s`); kw("VHI-12 aktuell", n("pz_vhi") === null ? null : `${n("pz_vhi")} / 48`); kw("Entscheidung", L("PZ-10")); }
  if (f.pb_r != null && f.pb_b != null && f.pb_h != null) kw("RBH", `R${f.pb_r} B${f.pb_b} H${f.pb_h}`);
  kw("AVQI · ABI", n("pb_avqi") === null ? null : `${zahl(n("pb_avqi"))}${n("pb_abi") === null ? "" : " · " + zahl(n("pb_abi"))}`);
  kw("Tonhaltedauer", n("pb_mpt") === null ? null : `${zahl(n("pb_mpt"))} s`);
  kw("VHI-12", n("pb_vhi") === null ? null : `${n("pb_vhi")} / 48`);
  kw("Einordnung", L("PB-17"));
  if (f.dp_hno_befund !== "JA") warnungen.push("Kein ärztlicher Kehlkopfbefund (DP-01): anfordern; ohne Befund keine Folgeverordnung.");
}

// ---------- Rückmeldung an Ärzt:in ----------
const gruende = [];
if (f.mv_dg_pruefung === "FALSCH") gruende.push("Korrektur der Diagnosegruppe (MV-27/28)");
if (f.mv_zus_dg_vorhanden === "ja") gruende.push("zusätzliche Diagnosegruppe(n) mit Bitte um Abklärung (MV-33–41)");
if (fees && arr("fe_abklaerung").some(c => c !== "KEINE")) gruende.push(`fachärztliche Abklärung nach FEES: ${L("FE-52")}`);
if (arr("pe_empf_arzt").some(c => c !== "KEINE")) gruende.push(`Empfehlungen Stimme: ${L("PE-11")}`);
if (arr("me_empfehlung").some(c => c !== "KEINE")) gruende.push(`Empfehlungen Myofunktion: ${L("ME-12")}`);
if (arr("ae_weitere").some(c => ["ARZT", "NEUROPSY", "HOER", "AUGE"].includes(c))) gruende.push(`Empfehlungen Aphasie: ${L("AE-11")}`);
for (const [k, id] of [["de_indikation", "DE-02"], ["pe_indikation", "PE-02"], ["me_indikation", "ME-02"]]) if (f[k] === "ABKL") gruende.push(`erst ärztliche Abklärung (${id})`);
if (f.pz_arzt === "ja") gruende.push("ärztliche Kontrolle des Kehlkopfs angeregt (PZ-09)");

const screening = Array.isArray(p.screening) ? p.screening : [];
const flags = {
  module,
  terminart: verlauf ? "VERLAUF" : "ERST",
  trachealkanuele: f.da_tk === "JA",
  fees_durchgefuehrt: fees,
  arzt_rueckmeldung: gruende.length > 0,
  diagnostik_fortsetzen: [f.ed_diagnostik_status, f.ae_status, f.de_status, f.me_status, f.pe_status].includes("FORTS"),
};

// ---------- Kontext für den Agenten (nach Abschnitten) ----------
const abschnitte = {};
for (const z of lesbar) (abschnitte[z.abschnitt] = abschnitte[z.abschnitt] || []).push(`- ${z.feld} (${z.id}): ${z.wert}`);
const scrZeilen = screening.map(s => `- ${s.sc_instrument}: Score ${s.sc_score ?? "–"}, Einordnung ${s.sc_einordnung ?? "–"}, Konsequenz ${(s.sc_konsequenz || []).join(", ") || "–"}`);
const kontext = [
  `Berichtsart: ${verlauf ? "Zwischenbericht (Zwischenbewertung am Ende der Verordnung)" : "Erstbericht (Erstdiagnostik)"}`,
  `Module: ${module.map(m => MODULNAME[m]).join(", ") || "keins"}`,
  `Diagnosegruppe laut Verordnung: ${p.diagnosegruppe || "–"}`,
  `Pseudonym (tinana-ID): ${p.tinana_patient_id}`,
  ...Object.entries(abschnitte).map(([k, v]) => `\n## ${k}\n${v.join("\n")}`),
  `\n## Kennwerte (berechnet bzw. übernommen, verbindlich)\n${scoreZeilen.join("\n") || "- keine"}`,
  `\n## Screening-Ergebnisse\n${scrZeilen.join("\n") || "- keine"}`,
  `\n## Rückmeldung an Ärzt:in\n- erforderlich: ${gruende.length ? "ja" : "nein"}${gruende.map(g => "\n- Grund: " + g).join("")}`,
].join("\n");

const datum = verlauf ? (f.dz_datum || f.mz_datum || f.pz_datum || (p.gesendet_am || "").slice(0, 10)) : (f.vo_aufnahmedatum || (p.gesendet_am || "").slice(0, 10));
return {
  patient_id: String(p.tinana_patient_id),
  therapeut: p.therapeut || f.vo_aufnehmende || "",
  datum,
  diagnosegruppe: p.diagnosegruppe || "",
  module,
  modulnamen: module.map(m => MODULNAME[m]),
  terminart: flags.terminart,
  kennwerte,
  arzt_gruende: gruende,
  guss: { gesamt: guss, schweregrad: gussGrad, abbruch_nach: abbruch },
  fees: { durchgefuehrt: fees, pas_max: pasMax, fedss },
  flags,
  warnungen,
  kontext,
};
