(() => {
  "use strict";

  const shell = document.querySelector("#atlas-shell");
  const rankRange = document.querySelector("#rank-range");
  const rankNumber = document.querySelector("#rank-number");
  const rankLabel = document.querySelector("#rank-label");
  const previousButton = document.querySelector("#previous-rank");
  const nextButton = document.querySelector("#next-rank");
  const copyLinkButton = document.querySelector("#copy-link");
  const searchForm = document.querySelector("#diagram-search");
  const searchInput = document.querySelector("#diagram-query");
  const searchResults = document.querySelector("#search-results");
  const diagramOptions = document.querySelector("#diagram-options");
  const cards = {
    interestingness: document.querySelector('[data-card="interestingness"]'),
    compressibility: document.querySelector('[data-card="compressibility"]'),
    modifiedCompression: document.querySelector('[data-card="modifiedCompression"]')
  };

  const preferenceForm = document.querySelector("#preference-form");
  const preferenceSelects = [
    document.querySelector("#preference-first"),
    document.querySelector("#preference-second"),
    document.querySelector("#preference-third")
  ];
  const researchConsent = document.querySelector("#research-consent");
  const preferenceStatus = document.querySelector("#preference-status");
  const preferenceProgress = document.querySelector("#preference-progress");
  const preferenceProgressBar = document.querySelector("#preference-progress-bar");
  const preferenceResults = document.querySelector("#preference-results");
  const resetCurrentPreference = document.querySelector("#reset-current-preference");
  const exportPreferences = document.querySelector("#export-preferences");
  const clearPreferences = document.querySelector("#clear-preferences");

  const imageDialog = document.querySelector("#image-dialog");
  const dialogImage = document.querySelector("#dialog-image");
  const imageDialogTitle = document.querySelector("#image-dialog-title");
  const imageDialogCaption = document.querySelector("#image-dialog-caption");
  const imageDialogDownload = document.querySelector("#image-dialog-download");
  const zoomLevel = document.querySelector("#zoom-level");
  const zoomInButton = document.querySelector("#zoom-in");
  const zoomOutButton = document.querySelector("#zoom-out");

  const pdfDialog = document.querySelector("#pdf-dialog");
  const pdfFrame = document.querySelector("#pdf-frame");
  const pdfDialogTitle = document.querySelector("#pdf-dialog-title");
  const pdfOpenNew = document.querySelector("#pdf-open-new");
  const pdfDownload = document.querySelector("#pdf-download");

  const STORAGE_KEY = "triangleBeautyPreferences:v1";
  const METHOD_ORDER = ["interestingness", "compressibility", "modifiedCompression"];
  const METHOD_LABELS = {
    interestingness: "Interestingness",
    compressibility: "Compressibility",
    modifiedCompression: "Modified compressibility"
  };
  const preferenceConfig = window.TRIANGLE_BEAUTY_PREFERENCE_CONFIG || {};

  let atlas = null;
  let currentRank = 1;
  let zoom = 1;
  let searchIndex = [];
  let preferenceState = loadPreferenceState();

  const format = {
    score: value => Number(value).toFixed(3),
    ratio: value => Number(value).toFixed(4),
    integer: value => Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 }),
    rank: value => `#${Number(value).toLocaleString("en-US")}`
  };

  function createVisitorId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `anonymous-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function emptyPreferenceState() {
    return { visitorId: createVisitorId(), atlasVersion: null, votes: {} };
  }

  function loadPreferenceState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (parsed && parsed.visitorId && parsed.votes && typeof parsed.votes === "object") return parsed;
    } catch (error) {
      console.warn("Could not read saved preferences", error);
    }
    return emptyPreferenceState();
  }

  function savePreferenceState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferenceState));
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function metricElement(label, value) {
    const wrapper = document.createElement("div");
    wrapper.className = "metric";
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    wrapper.append(term, description);
    return wrapper;
  }

  function primaryRank(diagram, method) {
    if (method === "interestingness") return diagram.interestingnessRank;
    if (method === "compressibility") return diagram.compressibilityPosition;
    return diagram.modifiedCompressionRank;
  }

  function secondaryRank(diagram, method) {
    if (method === "interestingness") return `Code-bit rank ${format.rank(diagram.compressibilityRank)}`;
    if (method === "compressibility") return `Tied rank ${format.rank(diagram.compressibilityRank)}`;
    return `q/random ${format.ratio(diagram.quadtreeRelativeToRandom)}`;
  }

  function renderCard(card, diagram, method) {
    card._diagram = diagram;
    card._method = method;
    card.querySelector('[data-field="primary-rank"]').textContent = format.rank(primaryRank(diagram, method));
    card.querySelector('[data-field="other-rank"]').textContent = secondaryRank(diagram, method);
    card.querySelector('[data-field="diagram-id"]').textContent = diagram.diagramId;
    card.querySelector('[data-field="definition"]').textContent = diagram.definition;

    const image = card.querySelector('[data-field="image"]');
    const displayImage = diagram.displayImage || diagram.image;
    image.src = displayImage;
    image.width = diagram.displayWidth || 6667;
    image.height = diagram.displayHeight || 5779;
    image.alt = `${diagram.diagramId}: a sixfold-symmetric triangle-space attractor generated by the ${diagram.mapName} map`;
    const viewport = card.querySelector(".image-viewport");
    viewport.classList.toggle("rotated-for-display", Boolean(diagram.rotateForDisplay));
    const crop = diagram.displayCrop || [0, 0, 6667, 5779];
    const cropWidth = crop[2] - crop[0];
    const cropHeight = crop[3] - crop[1];
    image.style.width = `${(100 * 6667) / cropWidth}%`;
    image.style.left = `${(-100 * crop[0]) / cropWidth}%`;
    image.style.top = `${(-100 * crop[1]) / cropHeight}%`;

    const openImageButton = card.querySelector('[data-action="open-image"]');
    openImageButton.setAttribute("aria-label", `Open the full-resolution ${diagram.diagramId} image`);

    const download = card.querySelector('[data-field="download"]');
    download.href = diagram.image;
    download.download = `${diagram.diagramId}_50k.png`;
    download.setAttribute("aria-label", `Download ${diagram.diagramId} as a full-resolution PNG`);

    const metrics = card.querySelector('[data-field="metrics"]');
    metrics.replaceChildren(
      metricElement("Neural interestingness", format.score(diagram.interestingnessScore)),
      metricElement("Quadtree code bits", format.integer(diagram.quadtreeCodeBits)),
      metricElement("Quadtree / random", format.ratio(diagram.quadtreeRelativeToRandom)),
      metricElement("Modified compression", format.score(diagram.modifiedCompressionScore)),
      metricElement("PNG / random", format.ratio(diagram.pngRelativeToRandom)),
      metricElement("Fitted taste", format.score(diagram.fittedTaste))
    );
  }

  function updateUrl(rank) {
    const url = new URL(window.location.href);
    url.searchParams.set("rank", String(rank));
    window.history.replaceState({ rank }, "", url);
  }

  function comparisonAt(rank) {
    return atlas.comparisons[rank - 1];
  }

  function prefetchRank(rank) {
    if (!atlas || rank < 1 || rank > atlas.rankCount) return;
    const comparison = comparisonAt(rank);
    METHOD_ORDER.forEach(method => {
      const image = new Image();
      image.src = comparison[method].displayImage || comparison[method].image;
    });
  }

  function setPreferenceStatus(message, tone = "") {
    preferenceStatus.textContent = message;
    preferenceStatus.dataset.tone = tone;
  }

  function loadCurrentPreference() {
    const vote = preferenceState.votes[String(currentRank)];
    preferenceSelects.forEach((select, index) => {
      select.value = vote ? vote.ranking[index] : "";
    });
    researchConsent.checked = Boolean(vote && vote.consent);
    setPreferenceStatus(vote ? "This comparison is saved. You may revise it." : "");
  }

  function setRank(value, options = {}) {
    if (!atlas) return;
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed)) return;
    currentRank = Math.min(atlas.rankCount, Math.max(1, parsed));
    const comparison = comparisonAt(currentRank);

    rankRange.value = String(currentRank);
    rankNumber.value = String(currentRank);
    rankLabel.textContent = `${currentRank} of ${atlas.rankCount}`;
    previousButton.disabled = currentRank === 1;
    nextButton.disabled = currentRank === atlas.rankCount;

    METHOD_ORDER.forEach(method => renderCard(cards[method], comparison[method], method));
    loadCurrentPreference();
    updateUrl(currentRank);

    window.setTimeout(() => {
      prefetchRank(currentRank - 1);
      prefetchRank(currentRank + 1);
    }, 250);

    if (options.focusAtlas) {
      document.querySelector("#comparison-grid").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function buildSearchIndex() {
    const entries = [];
    const seenOptions = new Set();
    atlas.comparisons.forEach(comparison => {
      METHOD_ORDER.forEach(method => {
        const diagram = comparison[method];
        entries.push({
          rank: comparison.rank,
          method,
          diagramId: diagram.diagramId,
          center: diagram.center,
          map: diagram.map
        });
        if (!seenOptions.has(diagram.diagramId)) {
          const option = document.createElement("option");
          option.value = diagram.diagramId;
          diagramOptions.append(option);
          seenOptions.add(diagram.diagramId);
        }
      });
    });
    searchIndex = entries;
  }

  function searchDiagrams(query) {
    const normalized = query.trim().toUpperCase().replace(/[()\s]/g, "");
    if (!normalized) return [];
    const numberMatch = normalized.match(/\d+/);
    const center = numberMatch ? Number(numberMatch[0]) : null;
    const exact = searchIndex.filter(entry => entry.diagramId === normalized);
    if (exact.length) return exact;
    return searchIndex.filter(entry => {
      if (normalized.startsWith("X") && entry.diagramId.startsWith(normalized)) return true;
      return center !== null && entry.center === center;
    });
  }

  function renderSearchResults(matches, query) {
    searchResults.replaceChildren();
    if (!matches.length) {
      searchResults.textContent = `No Top 120 diagram matches “${query}”.`;
      return;
    }
    const prefix = document.createElement("span");
    prefix.textContent = matches.length === 1 ? "Found:" : "Matches:";
    searchResults.append(prefix);
    matches.forEach(match => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${match.diagramId} · ${METHOD_LABELS[match.method]} position ${match.rank}`;
      button.addEventListener("click", () => setRank(match.rank, { focusAtlas: true }));
      searchResults.append(button);
    });
  }

  function openImage(diagram) {
    zoom = 1;
    dialogImage.src = diagram.displayImage || diagram.image;
    dialogImage.classList.toggle("rotated-for-display", Boolean(diagram.rotateForDisplay));
    dialogImage.alt = `${diagram.diagramId}: full-resolution triangle-space attractor`;
    dialogImage.style.width = "100%";
    imageDialogTitle.textContent = diagram.diagramId;
    const presentation = diagram.targetOrientation === "visually-inverted" ? " · shown visually inverted in the comparison" : "";
    imageDialogCaption.textContent = diagram.displayImage
      ? `${diagram.definition} · lossless display crop${presentation}; download preserves the 6,667 × 5,779 source PNG`
      : `${diagram.definition} · 6,667 × 5,779 PNG${presentation}`;
    imageDialogDownload.href = diagram.image;
    imageDialogDownload.download = `${diagram.diagramId}_50k.png`;
    zoomLevel.value = "100%";
    openDialog(imageDialog);
  }

  function setZoom(nextZoom) {
    zoom = Math.min(4, Math.max(0.25, nextZoom));
    dialogImage.style.width = `${zoom * 100}%`;
    zoomLevel.value = `${Math.round(zoom * 100)}%`;
  }

  function openPdf(path, title) {
    pdfDialogTitle.textContent = title;
    pdfFrame.src = path;
    pdfOpenNew.href = path;
    pdfDownload.href = path;
    openDialog(pdfDialog);
  }

  function normalizePreferenceSelections(changedSelect) {
    if (!changedSelect.value) return;
    preferenceSelects.forEach(select => {
      if (select !== changedSelect && select.value === changedSelect.value) select.value = "";
    });
    const chosen = preferenceSelects.map(select => select.value).filter(Boolean);
    const empty = preferenceSelects.filter(select => !select.value);
    if (chosen.length === 2 && empty.length === 1) {
      empty[0].value = METHOD_ORDER.find(method => !chosen.includes(method));
    }
  }

  function currentRanking() {
    const ranking = preferenceSelects.map(select => select.value);
    return ranking.every(Boolean) && new Set(ranking).size === METHOD_ORDER.length ? ranking : null;
  }

  function votePayload(vote, action = "upsert") {
    return {
      action,
      studyVersion: preferenceConfig.studyVersion || "three-way-v1",
      atlasVersion: atlas.atlasVersion,
      visitorId: preferenceState.visitorId,
      consent: action === "upsert",
      comparisonRank: vote.rank,
      ranking: vote.ranking,
      diagramIds: vote.diagramIds,
      presentation: vote.presentation,
      clientTimestamp: vote.savedAt
    };
  }

  async function transmit(payload) {
    if (!preferenceConfig.endpoint) return { configured: false, accepted: false };
    const response = await fetch(preferenceConfig.endpoint, {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Collector returned ${response.status}`);
    return { configured: true, accepted: true };
  }

  async function submitCurrentPreference(event) {
    event.preventDefault();
    const ranking = currentRanking();
    if (!ranking) {
      setPreferenceStatus("Please assign each method a different rank.", "error");
      return;
    }
    const comparison = comparisonAt(currentRank);
    const savedAt = new Date().toISOString();
    const vote = {
      rank: currentRank,
      ranking,
      diagramIds: Object.fromEntries(METHOD_ORDER.map(method => [method, comparison[method].diagramId])),
      presentation: {
        positions: { left: "interestingness", middle: "compressibility", right: "modifiedCompression" },
        targetOrientation: { compressibility: "visually-inverted" },
        rotated180: METHOD_ORDER.filter(method => comparison[method].rotateForDisplay)
      },
      consent: researchConsent.checked,
      savedAt,
      contributedAt: null
    };
    preferenceState.atlasVersion = atlas.atlasVersion;
    preferenceState.votes[String(currentRank)] = vote;
    savePreferenceState();
    renderPreferenceSummary();

    if (!vote.consent) {
      setPreferenceStatus("Saved in this browser only.", "success");
      return;
    }
    setPreferenceStatus("Saved. Contributing anonymous ranking…");
    try {
      const result = await transmit(votePayload(vote));
      if (!result.configured) {
        setPreferenceStatus("Saved locally. Anonymous collection is not configured yet.", "warning");
        return;
      }
      vote.contributedAt = new Date().toISOString();
      savePreferenceState();
      setPreferenceStatus("Saved and contributed anonymously.", "success");
    } catch (error) {
      setPreferenceStatus("Saved locally; contribution could not be sent. You may retry.", "warning");
      console.warn("Preference contribution failed", error);
    }
  }

  async function resetCurrentVote() {
    const key = String(currentRank);
    const vote = preferenceState.votes[key];
    if (!vote) {
      loadCurrentPreference();
      return;
    }
    delete preferenceState.votes[key];
    savePreferenceState();
    loadCurrentPreference();
    renderPreferenceSummary();
    if (vote.contributedAt && preferenceConfig.endpoint) {
      try {
        await transmit(votePayload(vote, "retract"));
        setPreferenceStatus("This comparison was removed locally and from the study.", "success");
      } catch (error) {
        setPreferenceStatus("Removed locally; the research copy could not be retracted automatically.", "warning");
      }
    } else {
      setPreferenceStatus("This comparison was reset.", "success");
    }
  }

  async function syncPendingContributions() {
    if (!preferenceConfig.endpoint) return;
    const pending = Object.values(preferenceState.votes).filter(
      vote => vote.consent && !vote.contributedAt
    );
    for (const vote of pending) {
      try {
        await transmit(votePayload(vote));
        vote.contributedAt = new Date().toISOString();
      } catch (error) {
        console.warn("A pending preference contribution could not be synchronized", error);
        break;
      }
    }
    if (pending.length) savePreferenceState();
  }

  function renderPreferenceSummary() {
    const votes = Object.values(preferenceState.votes).filter(vote => Array.isArray(vote.ranking));
    preferenceProgress.textContent = `${votes.length} of ${atlas ? atlas.rankCount : 120} comparisons ranked`;
    preferenceProgressBar.style.width = `${atlas ? (100 * votes.length) / atlas.rankCount : 0}%`;
    preferenceResults.replaceChildren();

    if (!votes.length) {
      const empty = document.createElement("p");
      empty.className = "preference-empty";
      empty.textContent = "Your summary will appear after your first ranking.";
      preferenceResults.append(empty);
      return;
    }

    const results = METHOD_ORDER.map(method => {
      const placements = votes.map(vote => vote.ranking.indexOf(method) + 1).filter(rank => rank > 0);
      const first = placements.filter(rank => rank === 1).length;
      const mean = placements.reduce((sum, rank) => sum + rank, 0) / placements.length;
      return { method, first, mean };
    }).sort((a, b) => a.mean - b.mean || b.first - a.first);

    results.forEach((result, index) => {
      const row = document.createElement("div");
      row.className = "preference-result-row";
      const position = document.createElement("strong");
      position.textContent = String(index + 1);
      const label = document.createElement("span");
      label.textContent = METHOD_LABELS[result.method];
      const statistics = document.createElement("span");
      statistics.textContent = `${result.first} first-place · mean rank ${result.mean.toFixed(2)}`;
      row.append(position, label, statistics);
      preferenceResults.append(row);
    });
  }

  function exportPreferenceData() {
    const data = {
      exportedAt: new Date().toISOString(),
      atlasVersion: atlas.atlasVersion,
      studyVersion: preferenceConfig.studyVersion || "three-way-v1",
      comparisonsRanked: Object.keys(preferenceState.votes).length,
      votes: preferenceState.votes
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "triangle-beauty-my-preferences.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function clearAllPreferenceData() {
    if (!window.confirm("Clear every preference saved in this browser? Contributed study records will also be retracted when the collector is available.")) return;
    const visitorId = preferenceState.visitorId;
    const hadContributions = Object.values(preferenceState.votes).some(vote => vote.contributedAt);
    preferenceState = emptyPreferenceState();
    savePreferenceState();
    loadCurrentPreference();
    renderPreferenceSummary();
    if (hadContributions && preferenceConfig.endpoint) {
      try {
        await transmit({
          action: "retractAll",
          studyVersion: preferenceConfig.studyVersion || "three-way-v1",
          atlasVersion: atlas.atlasVersion,
          visitorId
        });
        setPreferenceStatus("Your local and contributed preference data were cleared.", "success");
      } catch (error) {
        setPreferenceStatus("Local data were cleared; contributed records could not be retracted automatically.", "warning");
      }
    } else {
      setPreferenceStatus("Your locally saved preference data were cleared.", "success");
    }
  }

  function bindEvents() {
    previousButton.addEventListener("click", () => setRank(currentRank - 1));
    nextButton.addEventListener("click", () => setRank(currentRank + 1));
    rankRange.addEventListener("input", event => setRank(event.target.value));
    rankNumber.addEventListener("change", event => setRank(event.target.value));
    rankNumber.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        setRank(event.currentTarget.value);
      }
    });

    copyLinkButton.addEventListener("click", async () => {
      const url = new URL(window.location.href);
      url.searchParams.set("rank", String(currentRank));
      url.hash = "atlas";
      try {
        await navigator.clipboard.writeText(url.toString());
        copyLinkButton.textContent = "Link copied";
      } catch {
        window.prompt("Copy this rank link:", url.toString());
      }
      window.setTimeout(() => { copyLinkButton.textContent = "Copy rank link"; }, 1800);
    });

    searchForm.addEventListener("submit", event => {
      event.preventDefault();
      const query = searchInput.value;
      renderSearchResults(searchDiagrams(query), query);
    });

    Object.values(cards).forEach(card => {
      card.querySelector('[data-action="open-image"]').addEventListener("click", () => openImage(card._diagram));
    });

    preferenceSelects.forEach(select => {
      select.addEventListener("change", event => normalizePreferenceSelections(event.currentTarget));
    });
    preferenceForm.addEventListener("submit", submitCurrentPreference);
    resetCurrentPreference.addEventListener("click", resetCurrentVote);
    exportPreferences.addEventListener("click", exportPreferenceData);
    clearPreferences.addEventListener("click", clearAllPreferenceData);

    zoomInButton.addEventListener("click", () => setZoom(zoom + 0.25));
    zoomOutButton.addEventListener("click", () => setZoom(zoom - 0.25));

    document.querySelectorAll("[data-pdf-preview]").forEach(button => {
      button.addEventListener("click", () => openPdf(button.dataset.pdfPreview, button.dataset.pdfTitle));
    });

    document.querySelectorAll("[data-dialog-close]").forEach(button => {
      button.addEventListener("click", () => closeDialog(document.querySelector(`#${button.dataset.dialogClose}`)));
    });

    [imageDialog, pdfDialog].forEach(dialog => {
      dialog.addEventListener("click", event => {
        if (event.target === dialog) closeDialog(dialog);
      });
    });

    pdfDialog.addEventListener("close", () => { pdfFrame.src = "about:blank"; });

    window.addEventListener("keydown", event => {
      const editable = event.target.matches("input, textarea, select, [contenteditable]");
      const dialogOpen = imageDialog.open || pdfDialog.open;
      if (editable || dialogOpen) return;
      if (event.key === "ArrowLeft") setRank(currentRank - 1);
      if (event.key === "ArrowRight") setRank(currentRank + 1);
    });

    window.addEventListener("popstate", () => {
      const rank = Number(new URL(window.location.href).searchParams.get("rank"));
      if (rank) setRank(rank);
    });
  }

  async function initialize() {
    try {
      const response = await fetch("data/atlas.json?v=20260927-three-way");
      if (!response.ok) throw new Error(`Atlas data returned ${response.status}`);
      atlas = await response.json();
      if (!Array.isArray(atlas.comparisons)) throw new Error("Atlas data are not the three-way edition");
      if (preferenceState.atlasVersion && preferenceState.atlasVersion !== atlas.atlasVersion) {
        preferenceState = emptyPreferenceState();
        savePreferenceState();
      }
      preferenceState.atlasVersion = atlas.atlasVersion;
      savePreferenceState();
      buildSearchIndex();
      bindEvents();
      renderPreferenceSummary();
      const requestedRank = Number(new URL(window.location.href).searchParams.get("rank"));
      setRank(requestedRank || 1);
      shell.setAttribute("aria-busy", "false");
      syncPendingContributions();
    } catch (error) {
      shell.setAttribute("aria-busy", "false");
      shell.innerHTML = `<p class="noscript">The interactive atlas could not be loaded. ${error.message}</p>`;
      console.error(error);
    }
  }

  initialize();
})();
