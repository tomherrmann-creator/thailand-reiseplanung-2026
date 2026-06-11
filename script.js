const files = {
  requirements: "anforderungen.md",
  plan: "reiseplan.md"
};

const linkGroups = [
  ["Offizielle Reiseinfos", "Tourism Authority of Thailand", "https://www.tourismthailand.org/"],
  ["Bangkok", "Grand Palace", "https://www.royalgrandpalace.th/en/home"],
  ["Bahn", "SRT D-Ticket", "https://dticket.railway.co.th/"],
  ["Khao Sok", "TAT Trusted Thailand", "https://trustedthailand.tourismthailand.org/en/establishments/detail/1550"],
  ["Krabi", "TAT Krabi", "https://www.tourismthailand.org/Destinations/Provinces/Krabi/344"],
  ["Tauchen", "PADI Koh Lanta", "https://www.padi.com/diving-in/koh-lanta/"],
  ["Flüge", "Bangkok Airways Flugplan", "https://www.bangkokair.com/flight/flight-schedule"],
  ["Flüge", "Thai AirAsia", "https://www.airasia.com/"],
  ["Flüge", "Thai Vietjet", "https://www.vietjetair.com/en"],
  ["Einreise", "Royal Thai Embassy Berlin", "https://berlin.thaiembassy.org/de/page/allgemeine-informationen"],
  ["Updates", "TAT Newsroom", "https://www.tatnews.org/"]
];

async function init() {
  const [requirements, plan] = await Promise.all([
    loadMarkdown(files.requirements),
    loadMarkdown(files.plan)
  ]);

  document.querySelector("#requirementsMarkdown").innerHTML = markdownToHtml(requirements);
  document.querySelector("#planMarkdown").innerHTML = markdownToHtml(extractSection(plan, "Buchungs- und Organisationshinweise") || plan);

  const phases = parseMarkdownTable(extractSection(plan, "Reisephasen"));
  const days = parseMarkdownTable(extractSection(plan, "Tagesplan"));

  renderPhases(phases);
  renderDays(days);
  renderLinks(linkGroups);
  updateDiveCount(days);
}

async function loadMarkdown(path) {
  try {
    const response = await fetch(`${path}?v=${Date.now()}`);
    if (!response.ok) throw new Error(`${path} konnte nicht geladen werden`);
    return await response.text();
  } catch (error) {
    return `## Datei nicht geladen\n\n${error.message}. Bitte die Website ueber einen lokalen Server starten.`;
  }
}

function extractSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return "";
  const result = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith("## ")) break;
    result.push(lines[index]);
  }
  return result.join("\n").trim();
}

function parseMarkdownTable(markdown) {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"));

  if (lines.length < 3) return [];

  const headers = splitTableRow(lines[0]);
  return lines.slice(2).map((line) => {
    const values = splitTableRow(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

function splitTableRow(line) {
  return line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function renderPhases(phases) {
  const container = document.querySelector("#phaseGrid");
  container.innerHTML = phases.map((phase) => `
    <article class="phase-card">
      <img src="${escapeAttribute(phase.Bild)}" alt="${escapeAttribute(phase.Standort)}" loading="lazy">
      <div class="phase-card__body">
        <div class="phase-card__date"><span>${escapeHtml(phase.Datum)}</span><span>${escapeHtml(phase.Nächte)} Nächte</span></div>
        <h3>${escapeHtml(phase.Standort)}</h3>
        <p><strong>${escapeHtml(phase.Phase)}</strong> · ${escapeHtml(phase.Schwerpunkt)}</p>
      </div>
    </article>
  `).join("");
}

function renderDays(days) {
  const container = document.querySelector("#dayTimeline");
  container.innerHTML = days.map((day) => {
    const isDive = day.Tauchen && day.Tauchen !== "Vorbereitung";
    const focusTags = getDayFocus(day);
    return `
      <article class="day-card ${isDive ? "is-dive" : ""}">
        <div>
          <span class="day-card__meta">Tag</span>
          <strong>${escapeHtml(day.Tag)}</strong>
        </div>
        <div>
          <span class="day-card__meta">${escapeHtml(day.Datum)}</span>
          <strong>${escapeHtml(day.Ort)}</strong>
          <div class="day-focus">${focusTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        </div>
        <p>${escapeHtml(day.Plan)}</p>
        <div>
          <p>${escapeHtml(day.Transport)}</p>
          ${day.Tauchen ? `<span class="badge">${escapeHtml(day.Tauchen)}</span>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function getDayFocus(day) {
  const text = `${day.Ort} ${day.Plan} ${day.Transport} ${day.Tauchen}`.toLowerCase();
  const tags = [];

  if (day.Tauchen) tags.push("Tauchen");
  if (/flug|transfer|zug|fähre|speedboat|minivan|bus/.test(text)) tags.push("Transfer");
  if (/wat|temple|palace|historisch|sukhothai|ayutthaya|market|chinatown|old town|streetfood|loy krathong|yi peng/.test(text)) tags.push("Kultur");
  if (/lake|national|doi|trail|wasserfall|kajak|mangroven|railay|strand|höhle|dschungel|khao sok|tiger cave|emerald|hot springs/.test(text)) tags.push("Natur");

  return tags.slice(0, 3);
}

function renderLinks(links) {
  const container = document.querySelector("#linkGrid");
  container.innerHTML = links.map(([group, label, url]) => `
    <a class="link-card" href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">
      <span>${escapeHtml(group)}</span>
      <strong>${escapeHtml(label)}</strong>
      <p>${escapeHtml(new URL(url).hostname)}</p>
    </a>
  `).join("");
}

function updateDiveCount(days) {
  const diveDays = days.filter((day) => /^Tag \d/.test(day.Tauchen || "")).length;
  document.querySelector("#diveCount").textContent = String(diveDays);
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inList = false;
  let inTable = false;
  let tableHeaders = [];

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  const closeTable = () => {
    if (inTable) {
      html.push("</tbody></table>");
      inTable = false;
      tableHeaders = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      closeList();
      closeTable();
      continue;
    }

    if (line.startsWith("|") && line.endsWith("|")) {
      closeList();
      const cells = splitTableRow(line).map(inlineMarkdown);
      const next = lines[index + 1] || "";
      if (!inTable && /^\|\s*:?-{3,}/.test(next)) {
        tableHeaders = cells;
        html.push(`<table><thead><tr>${cells.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>`);
        inTable = true;
        index += 1;
        continue;
      }
      if (inTable && cells.length === tableHeaders.length) {
        html.push(`<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`);
      }
      continue;
    }

    closeTable();

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
    } else {
      closeList();
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }

  closeList();
  closeTable();
  return html.join("");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value);
}

init();
