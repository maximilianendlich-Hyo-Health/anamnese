// Langdock-Workflow „Ersttermin“ – Code-Knoten „pdf“ (Sprache: JavaScript)
// Erzeugt den Erst- bzw. Zwischenbericht (alle Module) im HYO-Branding (Quicksand, Logo, HYO-Violett/Mint) und, falls
// erforderlich, die Arztrückmeldung als Brief. Keine externen Bibliotheken.
// GENERIERT mit tools/build_pdf_node.py – Logik in tools/pdf_node_template.js ändern.

const PRAXIS = {
  zeile1: "HYO Health · Logopädie",
  zeile2: "MEDICUM Friedrichshain · Matthiasstraße 7 · 10249 Berlin",
  zeile3: "Tel. 0151 72887811 · info@hyo-health.de · hyo-health.de",
  fuss: "HYO Health GmbH · Rudolfstraße 12 · 10245 Berlin · HRB 288004 B, Amtsgericht Charlottenburg",
};
const A = /*__ASSETS__*/null;

const e = eingang.output;
const t = (typeof tinana_lesen !== "undefined" && tinana_lesen.output) || { stammdaten: {}, verordnung: {}, abgleich: [] };
let b = befund.output.structured;
if (typeof b === "string") b = JSON.parse(b);

// ---------- Farben (HYO-CI) ----------
const C = {
  violett: [0.510, 0.506, 0.741],   // #8281BD
  tief: [0.357, 0.353, 0.600],      // #5B5A99
  mint: [0.761, 0.890, 0.859],      // #C2E3DB
  mintHell: [0.925, 0.965, 0.953],  // Mint 30 %
  violettHell: [0.937, 0.937, 0.973], // Violett 12 %
  text: [0.180, 0.180, 0.220],
  grau: [0.420, 0.420, 0.470],
};
const rgb = (c, stroke) => `${c.map(v => v.toFixed(3)).join(" ")} ${stroke ? "RG" : "rg"}`;

// ---------- Text-Kodierung (Windows-1252) ----------
const W1252 = { "€": 0x80, "‚": 0x82, "„": 0x84, "…": 0x85, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "™": 0x99 };
const SUB = { "≥": ">=", "≤": "<=", "≠": "!=", "→": "->", "₂": "2", " ": " ", " ": " ", " ": " " };
const code = ch => { const c = ch.charCodeAt(0); if (c < 128 || (c >= 160 && c <= 255)) return c; return W1252[ch] || 63; };
const clean = s => [...String(s ?? "").replace(/\s*\n\s*/g, " ")].map(ch => SUB[ch] ?? ch).join("").trim();
const width = (s, size, bold) => { const w = (bold ? A.bold : A.regular).widths; return [...s].reduce((a, ch) => a + (w[code(ch) - 32] || 500), 0) * size / 1000; };
const esc = s => [...s].map(ch => { const c = code(ch); if (c === 40 || c === 41 || c === 92) return "\\" + ch; return c >= 32 && c <= 126 ? String.fromCharCode(c) : "\\" + c.toString(8).padStart(3, "0"); }).join("");
function wrap(text, size, bold, maxW) {
  const lines = []; let line = "";
  for (const word of clean(text).split(" ").filter(Boolean)) {
    const t2 = line ? line + " " + word : word;
    if (width(t2, size, bold) <= maxW || !line) line = t2; else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}
const datumDE = d => (/^\d{4}-\d{2}-\d{2}/.test(d || "") ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : (d || ""));

// ---------- Seitenaufbau ----------
const PW = 595.28, PH = 841.89, M = 56, MAXW = PW - 2 * M, FOOT = 46;
function Doc(kurztitel) {
  const pages = []; let ops = null, y = 0;
  const d = {
    get y() { return y; }, set y(v) { y = v; },
    text(s, x, yy, size, bold, color, align) {
      const str = clean(s); let xx = x;
      if (align === "right") xx = x - width(str, size, bold);
      ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${rgb(color || C.text)} ${xx.toFixed(2)} ${yy.toFixed(2)} Td (${esc(str)}) Tj ET`);
    },
    rect(x, yy, w, h, color) { ops.push(`${rgb(color)} ${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`); },
    line(x1, y1, x2, y2, color, lw) { ops.push(`${rgb(color, true)} ${lw || 0.6} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`); },
    logo(x, yy, h) { const w = h * A.logo.w / A.logo.h; ops.push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${yy.toFixed(2)} cm /Im1 Do Q`); return w; },
    newPage() {
      ops = []; pages.push(ops);
      if (pages.length === 1) {
        d.logo(M, PH - 40 - 34, 34);
        d.text(PRAXIS.zeile1, PW - M, PH - 46, 8.5, true, C.tief, "right");
        d.text(PRAXIS.zeile2, PW - M, PH - 58, 7.5, false, C.grau, "right");
        d.text(PRAXIS.zeile3, PW - M, PH - 69, 7.5, false, C.grau, "right");
        d.line(M, PH - 86, PW - M, PH - 86, C.violett, 1.2);
        y = PH - 116;
      } else {
        d.logo(M, PH - 36 - 18, 18);
        d.text(kurztitel, PW - M, PH - 46, 8, false, C.grau, "right");
        d.line(M, PH - 62, PW - M, PH - 62, C.mint, 0.8);
        y = PH - 88;
      }
    },
    need(h) { if (y - h < M + FOOT - 20) d.newPage(); },
    heading(s) {
      d.need(46); y -= 6;
      d.rect(M, y - 2, 3, 12, C.violett);
      d.text(s, M + 10, y, 11.5, true, C.tief); y -= 18;
    },
    para(s, opt = {}) {
      const size = opt.size || 9.8, lead = opt.lead || 14.2, x = M + (opt.indent || 0);
      for (const l of wrap(s, size, opt.bold, MAXW - (opt.indent || 0))) { d.need(lead); d.text(l, x, y, size, opt.bold, opt.color); y -= lead; }
      y -= opt.after ?? 6;
    },
    bullets(items) {
      for (const it of items || []) {
        const lines = wrap(it, 9.8, false, MAXW - 14);
        lines.forEach((l, i) => { d.need(14.2); if (i === 0) d.rect(M + 2, y + 2.4, 3.2, 3.2, C.violett); d.text(l, M + 14, y, 9.8); y -= 14.2; });
        y -= 3;
      }
      y -= 5;
    },
    finish(fusszeile) {
      // Objekte: 1 Katalog, 2 Seiten, 3–5 F1, 6–8 F2, 9 Logo, 10 Logo-Maske, ab 11 Seiten
      const objs = [];
      const font = (f, n0) => {
        objs[n0] = `<< /Type /Font /Subtype /TrueType /BaseFont /${f.name} /FirstChar 32 /LastChar 255 /Widths [${f.widths.join(" ")}] /Encoding /WinAnsiEncoding /FontDescriptor ${n0 + 1} 0 R >>`;
        objs[n0 + 1] = `<< /Type /FontDescriptor /FontName /${f.name} /Flags 32 /FontBBox [${f.bbox.join(" ")}] /ItalicAngle 0 /Ascent ${f.ascent} /Descent ${f.descent} /CapHeight ${f.capHeight} /StemV 80 /FontFile2 ${n0 + 2} 0 R >>`;
        const bin = atob(f.ttf);
        objs[n0 + 2] = `<< /Length ${bin.length} /Length1 ${bin.length} >>\nstream\n${bin}\nendstream`;
      };
      objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
      font(A.regular, 3); font(A.bold, 6);
      const img = atob(A.logo.rgb), mask = atob(A.logo.alpha);
      objs[9] = `<< /Type /XObject /Subtype /Image /Width ${A.logo.w} /Height ${A.logo.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /SMask 10 0 R /Length ${img.length} >>\nstream\n${img}\nendstream`;
      objs[10] = `<< /Type /XObject /Subtype /Image /Width ${A.logo.w} /Height ${A.logo.h} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${mask.length} >>\nstream\n${mask}\nendstream`;
      const kids = [];
      pages.forEach((p, i) => {
        const pid = 11 + i * 2, cid = pid + 1; kids.push(`${pid} 0 R`);
        ops = p;
        d.line(M, M + 6, PW - M, M + 6, C.mint, 0.8);
        d.text(fusszeile, M, M - 6, 7, false, C.grau);
        d.text(`Seite ${i + 1} von ${pages.length}`, PW - M, M - 6, 7, false, C.grau, "right");
        const stream = p.join("\n");
        objs[pid] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 3 0 R /F2 6 0 R >> /XObject << /Im1 9 0 R >> >> /Contents ${cid} 0 R >>`;
        objs[cid] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
      });
      objs[2] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pages.length} >>`;
      let pdf = "%PDF-1.4\n%âãÏÓ\n"; const off = [];
      for (let i = 1; i < objs.length; i++) { off[i] = pdf.length; pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
      const xref = pdf.length;
      pdf += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + off.slice(1).map(o => String(o).padStart(10, "0") + " 00000 n \n").join("");
      pdf += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
      return btoa(pdf);
    },
  };
  return d;
}
// Zweispaltige Infobox mit Hintergrund; Werte bis zu drei Zeilen, Zeilenhöhe je Reihe dynamisch
function infoBox(d, rows, bg) {
  const colW = (MAXW - 24) / 2, pad = 12, lh = 11.5;
  const lines = rows.map(col => col.map(([, v]) => wrap(v || "–", 9.4, true, colW - 4).slice(0, 3)));
  const n = Math.max(rows[0].length, rows[1].length);
  const rh = Array.from({ length: n }, (_, i) => 13.5 + lh * Math.max((lines[0][i] || [""]).length, (lines[1][i] || [""]).length));
  const h = rh.reduce((a, b) => a + b, 0) + pad * 2 - 4;
  d.need(h + 10);
  const top = d.y + 4;
  d.rect(M, top - h, MAXW, h, bg);
  rows.forEach((col, ci) => {
    let yy = top - pad - 7;
    col.forEach(([label], ri) => {
      const x = M + pad + ci * (colW + 12);
      d.text(label, x, yy, 7, false, C.grau);
      lines[ci][ri].forEach((l, k) => d.text(l, x, yy - 11.5 - k * lh, 9.4, true, C.text));
      yy -= rh[ri];
    });
  });
  d.y = top - h - 16;
}

// ---------- Werte aufbereiten ----------
const s = t.stammdaten || {}, vo = t.verordnung || {};
const verlauf = e.terminart === "VERLAUF";
const art = verlauf ? "Zwischenbericht" : "Erstbericht";
const fees = !!(e.fees && e.fees.durchgefuehrt);
const patientName = s.name || `tinana-ID ${e.patient_id}`;
const kurz = `${art} · ${patientName}${s.geburtsdatum ? ", geb. " + datumDE(s.geburtsdatum) : ""}`;
const datei = x => x.replace(/[^\w.\-]/g, "_");
const modText = (e.modulnamen || []).join(" und ") || "Logopädie";

// ---------- Erst- bzw. Zwischenbericht ----------
const d = Doc(kurz); d.newPage();
d.text(`Logopädischer ${art}`, M, d.y, 20, true, C.tief); d.y -= 18;
d.text(`${modText} · Diagnosegruppe ${e.diagnosegruppe || vo.diagnosegruppe || "–"}${fees ? " · mit FEES" : ""}`, M, d.y, 10, false, C.grau); d.y -= 22;
infoBox(d, [
  [["Patient:in", s.name || "–"], ["Geburtsdatum", datumDE(s.geburtsdatum) || "–"], ["Krankenkasse", s.krankenkasse || "–"], ["tinana-ID", e.patient_id]],
  [["Verordnung von", vo.arzt || "–"], ["Ausgestellt am · ICD-10", `${datumDE(vo.ausgestellt_am) || "–"} · ${(vo.icd10 || []).join(", ") || "–"}`], [verlauf ? "Zwischenbewertung" : "Ersttermin", datumDE(e.datum) || "–"], ["Logopäd:in", e.therapeut || "–"]],
], C.mintHell);

const kw = (e.kennwerte || []).map(k => [k.label, k.wert]);
if (kw.length) {
  const half = Math.ceil(kw.length / 2);
  d.text("Auf einen Blick", M, d.y, 9, true, C.tief); d.y -= 8;
  infoBox(d, [kw.slice(0, half), kw.slice(half)], C.violettHell);
}

d.heading("Anamnese"); d.para(b.anamnese);
for (const a of b.befund_abschnitte || []) { if (clean(a.text)) { d.heading(a.titel); d.para(a.text); } }
d.heading("Beurteilung"); d.para(b.beurteilung);
if ((b.empfehlungen || []).length) { d.heading("Empfehlungen"); d.bullets(b.empfehlungen); }
if ((b.therapieziele || []).length) { d.heading("Therapieziele"); d.bullets(b.therapieziele); }
d.heading("Weiteres Vorgehen"); d.para(b.weiteres_vorgehen);
d.need(48); d.y -= 10;
d.line(M, d.y + 8, M + 180, d.y + 8, C.mint, 0.8);
d.text(`${e.therapeut || ""}, Logopäd:in · HYO Health`, M, d.y - 4, 9.4, true); d.y -= 16;
d.text("Freigegeben im Vier-Augen-Prinzip vor der Übermittlung.", M, d.y - 2, 8, false, C.grau);
const tag = e.datum || new Date().toISOString().slice(0, 10);
const befundName = datei(`${art}_${e.diagnosegruppe || "Logopaedie"}_${e.patient_id}_${tag}.pdf`);
const befundPdf = d.finish(`${PRAXIS.fuss}`);

// ---------- Arztrückmeldung ----------
let arztPdf = null, arztName = null;
const ar = b.arzt_rueckmeldung || {};
if (e.flags.arzt_rueckmeldung && ar.erforderlich && clean(ar.text)) {
  const a = Doc(`Rückmeldung · ${patientName}`); a.newPage();
  a.text("An", M, a.y, 7.5, false, C.grau); a.y -= 13;
  a.text(vo.arzt || "verordnende Praxis", M, a.y, 10.5, true); a.y -= 13;
  a.text("über tinana / KIM", M, a.y, 8.5, false, C.grau);
  a.text(`Berlin, ${datumDE(new Date().toISOString().slice(0, 10))}`, PW - M, a.y + 26, 9, false, C.grau, "right");
  a.y -= 34;
  for (const l of wrap(ar.betreff || "Rückmeldung zur Heilmittelverordnung", 13, true, MAXW)) { a.text(l, M, a.y, 13, true, C.tief); a.y -= 17; }
  a.y -= 2;
  a.para(`Betrifft: ${patientName}${s.geburtsdatum ? ", geb. " + datumDE(s.geburtsdatum) : ""} · tinana-ID ${e.patient_id} · Verordnung vom ${datumDE(vo.ausgestellt_am) || "–"} (${vo.diagnosegruppe || e.diagnosegruppe || "–"})`, { size: 9, color: C.grau, after: 14 });
  a.para("Sehr geehrte Damen und Herren,", { after: 8 });
  a.para(ar.text, { after: 10 });
  a.para("Für Rückfragen stehen wir Ihnen gern zur Verfügung.", { after: 14 });
  a.para("Mit freundlichen Grüßen", { after: 22 });
  a.text(`${e.therapeut || ""}, Logopäd:in`, M, a.y, 9.8, true); a.y -= 13;
  a.text("HYO Health · Logopädie", M, a.y, 9, false, C.grau);
  arztName = datei(`Rueckmeldung_Arzt_${e.patient_id}_${tag}.pdf`);
  arztPdf = a.finish(PRAXIS.fuss);
}

const files = [{ fileName: befundName, mimeType: "application/pdf", base64: befundPdf }];
if (arztPdf) files.push({ fileName: arztName, mimeType: "application/pdf", base64: arztPdf });

return {
  pdf_befund_name: befundName,
  pdf_befund_base64: befundPdf,
  pdf_arzt_name: arztName,
  pdf_arzt_base64: arztPdf,
  arzt_rueckmeldung: !!arztPdf,
  pruefhinweise: [...(t.testmodus ? ["tinana im TESTMODUS: Stammdaten sind fiktiv."] : []), ...(e.warnungen || []), ...(t.abgleich || []), ...(b.pruefhinweise || [])],
  files,
};
