// Paste this into Extensions > Apps Script in any publication Google Sheet.
// Run lookupLinks() — fills "doi" and "link" columns using Semantic Scholar + CrossRef.

function lookupLinks() {
  const MAILTO = "dmanju@ee.iitb.ac.in";
  const sheet  = SpreadsheetApp.getActiveSheet();
  const data   = sheet.getDataRange().getValues();

  if (data.length < 2) {
    SpreadsheetApp.getUi().alert("Sheet has no data rows.");
    return;
  }

  const headers  = data[0].map(h => String(h).toLowerCase().trim());
  const titleCol = headers.indexOf("title");

  if (titleCol === -1) {
    SpreadsheetApp.getUi().alert('No "title" column found. Check your header row.');
    return;
  }

  // Find or create "doi" and "link" columns
  let doiCol  = headers.indexOf("doi");
  let linkCol = headers.indexOf("link");

  if (doiCol === -1) {
    doiCol = headers.length;
    sheet.getRange(1, doiCol + 1).setValue("doi");
    headers.push("doi");
  }
  if (linkCol === -1) {
    linkCol = headers.length;
    sheet.getRange(1, linkCol + 1).setValue("link");
    headers.push("link");
  }

  const authorsCol = headers.indexOf("authors");
  let filled = 0, skipped = 0, notFound = 0;

  for (let i = 1; i < data.length; i++) {
    const title       = String(data[i][titleCol]  || "").trim();
    const existingDoi = String(data[i][doiCol]    || "").trim();
    const existingLink= String(data[i][linkCol]   || "").trim();

    if (!title)                        continue;
    if (existingDoi && existingLink)   { skipped++; continue; }

    const authors = authorsCol !== -1 ? String(data[i][authorsCol] || "") : "";
    let didFill   = false;

    // ── 1. Try Semantic Scholar (best for CS conference papers) ──────────────
    const ss = querySemanticScholar(title);
    if (ss) {
      if (!existingDoi && ss.doi) {
        sheet.getRange(i + 1, doiCol  + 1).setValue("https://doi.org/" + ss.doi);
        didFill = true;
      }
      if (!existingLink && ss.link) {
        sheet.getRange(i + 1, linkCol + 1).setValue(ss.link);
        didFill = true;
      }
    }

    // ── 2. Fall back to CrossRef if still no DOI ─────────────────────────────
    if (!existingDoi && (!ss || !ss.doi)) {
      const doi = queryCrossRef(title, authors, MAILTO);
      if (doi) {
        sheet.getRange(i + 1, doiCol + 1).setValue("https://doi.org/" + doi);
        didFill = true;
      }
    }

    if (didFill) filled++;
    else         notFound++;

    Utilities.sleep(400);
  }

  SpreadsheetApp.getUi().alert(
    `Done!\n✓ Filled: ${filled}\n– Not found: ${notFound}\n↷ Already complete: ${skipped}`
  );
}

// ── Semantic Scholar ──────────────────────────────────────────────────────────
function querySemanticScholar(title) {
  const q   = encodeURIComponent(title.substring(0, 100));
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${q}&limit=3&fields=title,externalIds,openAccessPdf`;

  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;

    const papers = JSON.parse(res.getContentText()).data || [];
    for (const paper of papers) {
      if (!titleMatch(title, String(paper.title || ""))) continue;
      const ids   = paper.externalIds   || {};
      const doi   = ids.DOI || null;
      const arxiv = ids.ArXiv ? `https://arxiv.org/abs/${ids.ArXiv}` : null;
      const link  = (paper.openAccessPdf || {}).url || arxiv || null;
      if (doi || link) return { doi, link };
    }
  } catch (e) {
    console.error("Semantic Scholar error: " + title, e);
  }
  return null;
}

// ── CrossRef ──────────────────────────────────────────────────────────────────
function queryCrossRef(title, authors, mailto) {
  const q   = encodeURIComponent(title.substring(0, 120));
  const url = `https://api.crossref.org/works?query.title=${q}&rows=3&mailto=${mailto}`;

  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;

    const items = JSON.parse(res.getContentText()).message.items || [];
    for (const item of items) {
      const candidate = String((item.title || [])[0] || "");
      if (titleMatch(title, candidate)) return item.DOI;
    }
  } catch (e) {
    console.error("CrossRef error: " + title, e);
  }
  return null;
}

// ── Title similarity (Jaccard on meaningful words) ────────────────────────────
function titleMatch(a, b) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const na   = norm(a);
  const nb   = norm(b);
  if (na === nb) return true;

  const wa        = na.split(" ");
  const wb        = new Set(nb.split(" "));
  const meaningful = wa.filter(w => w.length > 3);
  const common     = meaningful.filter(w => wb.has(w));
  return meaningful.length > 0 && common.length / meaningful.length >= 0.8;
}
