import { FIELD_PACKS, tokenizeRole } from "./careerFieldPacks.js";

const MAX_INTERNAL = 14;

function dedupeKey(s) {
  return `${(s.title || "").toLowerCase()}|${(s.company || "").toLowerCase()}`;
}

export function pickSearchQuery(profile, applications) {
  if (profile.targetTitles?.length) {
    return profile.targetTitles.slice(0, 2).join(" ");
  }
  const fromApps = [...new Set(applications.map((a) => a.role).filter(Boolean))];
  if (fromApps.length) {
    return fromApps.slice(0, 2).join(" ");
  }
  const pack = FIELD_PACKS[profile.field] || FIELD_PACKS.other;
  return pack.adjacentTitles[0] || "jobs";
}

/**
 * Rule-based suggestions from career field + saved applications + target titles.
 */
export function buildInternalSuggestions(profile, applications) {
  const field = profile.field && FIELD_PACKS[profile.field] ? profile.field : "other";
  const pack = FIELD_PACKS[field];
  const out = [];
  const seen = new Set();

  const push = (item) => {
    const k = dedupeKey(item);
    if (seen.has(k) || !item.title) return;
    seen.add(k);
    out.push(item);
  };

  const appRoles = applications.map((a) => a.role).filter(Boolean);
  const appTokens = new Set();
  appRoles.forEach((r) => tokenizeRole(r).forEach((t) => appTokens.add(t)));
  const skillTokens = (profile.skills || []).map((s) => String(s).toLowerCase().trim()).filter(Boolean);

  for (const title of profile.targetTitles || []) {
    const t = String(title).trim();
    if (!t) continue;
    push({
      title: t,
      company: "— Your target title",
      location: profile.location || "",
      reason: `You added this target in your ${pack.label} profile — search boards and track applications here.`,
      source: "internal",
      url: pack.boards[0]?.url || null,
    });
  }

  const scored = pack.adjacentTitles.map((adj) => {
    const al = adj.toLowerCase();
    let score = 0;
    for (const tok of appTokens) {
      if (tok.length > 2 && (al.includes(tok) || (tok.length > 4 && al.includes(tok.slice(0, 5))))) score += 2;
    }
    for (const s of skillTokens) {
      if (s.length > 2 && al.includes(s)) score += 2;
    }
    for (const tt of profile.targetTitles || []) {
      const t = String(tt).toLowerCase();
      if (t.length > 3 && (al.includes(t.slice(0, 6)) || t.includes(al.slice(0, 6)))) score += 1;
    }
    return { adj, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const orderedAdjacent = [...new Set([...scored.map((x) => x.adj)])];

  for (const adj of orderedAdjacent.slice(0, 8)) {
    const row = scored.find((x) => x.adj === adj);
    const reason =
      row && row.score > 0
        ? `Overlaps your saved roles or skills — strong fit for ${pack.label}.`
        : `Common role family in ${pack.label} (expand or narrow your search).`;
    push({
      title: adj,
      company: "— Field-aligned idea",
      location: profile.location || "",
      reason,
      source: "internal",
      url: pack.boards[0]?.url || null,
    });
  }

  for (const r of [...new Set(appRoles)].slice(0, 3)) {
    push({
      title: `Similar searches: “${r}”`,
      company: "— From your tracker",
      location: profile.location || "",
      reason: "Try adjacent seniority, tech stack, or company size while keeping this title as a keyword.",
      source: "internal",
      url: pack.boards[1]?.url || pack.boards[0]?.url || null,
    });
  }

  if (pack.boards.length) {
    push({
      title: `Open ${pack.boards[0].name}`,
      company: "Job board",
      location: "",
      reason: `Hand-picked starting point for ${pack.label} searches.`,
      source: "internal",
      url: pack.boards[0].url,
    });
  }

  return out.slice(0, MAX_INTERNAL);
}

export async function fetchAdzunaJobs(what, where, country) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return { results: [], error: null };

  const cc = (country || "gb").toLowerCase();
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "8",
    what: what.slice(0, 120),
  });
  if (where && String(where).trim()) {
    params.set("where", String(where).trim().slice(0, 80));
  }

  const url = `https://api.adzuna.com/v1/api/jobs/${cc}/search/1?${params.toString()}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { results: [], error: `Adzuna HTTP ${res.status}: ${text.slice(0, 120)}` };
    }
    const data = await res.json();
    const list = (data.results || []).map((r) => ({
      title: r.title || "Role",
      company: r.company?.display_name || r.company || "Company",
      location: r.location?.display_name || r.location?.area?.[0] || "",
      reason: "Live listing from Adzuna for your profile search.",
      source: "adzuna",
      url: r.redirect_url || null,
    }));
    return { results: list, error: null };
  } catch (e) {
    return { results: [], error: e.message || "Adzuna fetch failed" };
  }
}

/**
 * Suggestions anchored to a single title (user's current job or the role they're applying for).
 */
export function buildPositionRelatedSuggestions(anchorPosition, profile) {
  const anchor = String(anchorPosition || "").trim();
  if (anchor.length < 2) return [];

  const field = profile.field && FIELD_PACKS[profile.field] ? profile.field : "other";
  const pack = FIELD_PACKS[field];
  const tokens = new Set(tokenizeRole(anchor));
  const out = [];
  const seen = new Set();

  const push = (item) => {
    const k = dedupeKey(item);
    if (seen.has(k) || !item.title) return;
    seen.add(k);
    out.push(item);
  };

  push({
    title: `Next steps from “${anchor.slice(0, 48)}${anchor.length > 48 ? "…" : ""}”`,
    company: "— Career ladder ideas",
    location: profile.location || "",
    reason: `Ranked using your anchor title and your ${pack.label} profile.`,
    source: "position",
    url: pack.boards[0]?.url || null,
  });

  const scored = pack.adjacentTitles.map((adj) => {
    let score = 0;
    const al = adj.toLowerCase();
    const an = anchor.toLowerCase();
    if (an.length > 4 && (al.includes(an.slice(0, 8)) || an.includes(al.slice(0, 8)))) score += 5;
    for (const tok of tokens) {
      if (tok.length > 2 && al.includes(tok)) score += 2;
    }
    for (const s of (profile.skills || []).map((x) => String(x).toLowerCase())) {
      if (s.length > 2 && al.includes(s)) score += 1;
    }
    return { adj, score };
  });
  scored.sort((a, b) => b.score - a.score);

  for (const { adj, score } of scored) {
    if (adj.toLowerCase() === anchor.toLowerCase()) continue;
    push({
      title: adj,
      company: "— Related role",
      location: profile.location || "",
      reason:
        score > 0
          ? `Overlaps words in your anchor title (“${anchor.slice(0, 36)}${anchor.length > 36 ? "…" : ""}”).`
          : `Typical adjacent title in ${pack.label} for someone with a similar background.`,
      source: "position",
      url: pack.boards[0]?.url || null,
    });
    if (out.length >= 10) break;
  }

  if (pack.boards[1]) {
    push({
      title: `Search boards for “${anchor.slice(0, 32)}${anchor.length > 32 ? "…" : ""}”`,
      company: pack.boards[1].name,
      location: "",
      reason: "Use this keyword on job sites alongside your location filters.",
      source: "position",
      url: pack.boards[1].url,
    });
  }

  return out.slice(0, 12);
}

export async function getSuggestionsForPosition(user, anchorPosition) {
  const profile = user.careerProfile || {};
  const internal = buildPositionRelatedSuggestions(anchorPosition, profile);
  const what = String(anchorPosition).trim().slice(0, 120);
  const where = profile.location || "";

  const { results: adzunaList, error: adzunaError } = await fetchAdzunaJobs(what, where, process.env.ADZUNA_COUNTRY || "gb");
  const adzunaMapped = adzunaList.map((s) => ({
    ...s,
    reason: "Live listing matched to this position / title search.",
  }));

  const seen = new Set();
  const merged = [];
  for (const s of adzunaMapped) {
    const k = dedupeKey(s);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(s);
  }
  for (const s of internal) {
    const k = dedupeKey(s);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(s);
  }

  const hasAdzuna = Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
  const meta = {
    field: profile.field || "other",
    fieldLabel: (FIELD_PACKS[profile.field] || FIELD_PACKS.other).label,
    anchorUsed: what,
    adzunaEnabled: hasAdzuna,
    adzunaError: adzunaError || null,
  };

  return { suggestions: merged, meta };
}

export async function getSuggestionsBundle(user, applications) {
  const profile = user.careerProfile || {};
  const internal = buildInternalSuggestions(profile, applications);
  const what = pickSearchQuery(profile, applications);
  const where = profile.location || "";

  const { results: adzunaList, error: adzunaError } = await fetchAdzunaJobs(what, where, process.env.ADZUNA_COUNTRY || "gb");

  const seen = new Set();
  const merged = [];

  for (const s of adzunaList) {
    const k = dedupeKey(s);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(s);
  }
  for (const s of internal) {
    const k = dedupeKey(s);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(s);
  }

  const hasAdzuna = Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
  const meta = {
    field: profile.field || "other",
    fieldLabel: (FIELD_PACKS[profile.field] || FIELD_PACKS.other).label,
    searchUsed: what,
    adzunaEnabled: hasAdzuna,
    adzunaError: adzunaError || null,
    hint: hasAdzuna
      ? null
      : "Optional: set ADZUNA_APP_ID, ADZUNA_APP_KEY, and ADZUNA_COUNTRY (e.g. gb or us) for live listings.",
  };

  return { suggestions: merged, meta };
}
