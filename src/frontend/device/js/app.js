function initInterfaceScale(){
  const settingsBtn = document.getElementById("settingsBtn");
  const popover = document.getElementById("settingsPopover");
  const scaleButtons = [...document.querySelectorAll(".scale-option")];
  if(!settingsBtn || !popover || !scaleButtons.length) return;

  const storageKey = "devicehub-ui-scale";
  const normalizeScale = value => {
    const parsed = Number(value);
    return [0.9, 1, 1.1, 1.25].includes(parsed) ? parsed : 1;
  };

  function applyScale(value){
    const scale = normalizeScale(value);

    // Chromium/Edge/Chrome: scales the entire application while retaining layout flow.
    if("zoom" in document.body.style){
      document.body.style.zoom = String(scale);
    }else{
      // Fallback: text scales, while responsive layout remains intact.
      document.documentElement.style.fontSize = `${16 * scale}px`;
    }

    scaleButtons.forEach(button => {
      button.classList.toggle("active", Number(button.dataset.scale) === scale);
    });

    try{
      localStorage.setItem(storageKey, String(scale));
    }catch(_){}
  }

  let savedScale = 1;
  try{
    savedScale = normalizeScale(localStorage.getItem(storageKey) || 1);
  }catch(_){}
  applyScale(savedScale);

  settingsBtn.addEventListener("click", event => {
    event.stopPropagation();
    popover.hidden = !popover.hidden;
  });

  popover.addEventListener("click", event => event.stopPropagation());

  scaleButtons.forEach(button => {
    button.addEventListener("click", () => {
      applyScale(button.dataset.scale);
    });
  });

  document.addEventListener("click", () => {
    popover.hidden = true;
  });

  document.addEventListener("keydown", event => {
    if(event.key === "Escape"){
      popover.hidden = true;
    }
  });
}


let processes = [];
let runningProgramsLoading = false;
let runningProgramsError = false;
let runningProgramsLoaded = false;
let runningProgramsRequest = null;


let installedPrograms = [];
let installedProgramsLoading = false;
let installedProgramsError = false;



const API_BASE_URL = "http://127.0.0.1:8000";
const SCREENSHOT_META_URL = `${API_BASE_URL}/screenshot/current`;
const TRAFFIC_URL = `${API_BASE_URL}/eth-traffic/show-traffic`;
const TRAFFIC_RUN_SCAN_URL = `${API_BASE_URL}/eth-traffic/run-scan`;
const SYSTEM_URL = `${API_BASE_URL}/system/current`;
const RUNNING_PROGRAMS_URL = `${API_BASE_URL}/system/running-programs`;
const INSTALLED_PROGRAMS_URL = `${API_BASE_URL}/system/installed-programs`;

let webHistory = [];
let trafficSummary = {
  fromDate: "—",
  toDate: "—",
  totalDownloadMb: 0,
  totalUploadMb: 0,
  loading: true,
  error: false
};
let screenshots = [];
let currentScreenshotIndex = 0;

const trafficDownloadMetric = document.getElementById("trafficDownloadMetric");
const trafficUploadMetric = document.getElementById("trafficUploadMetric");
const trafficPeriod = document.getElementById("trafficPeriod");

const cpuMetricCard = document.getElementById("cpuMetricCard");
const cpuUsage = document.getElementById("cpuUsage");
const cpuDetails = document.getElementById("cpuDetails");
const cpuBar = document.getElementById("cpuBar");

const ramMetricCard = document.getElementById("ramMetricCard");
const ramUsage = document.getElementById("ramUsage");
const ramDetails = document.getElementById("ramDetails");
const ramBar = document.getElementById("ramBar");

const gpuMetricCard = document.getElementById("gpuMetricCard");
const gpuUsage = document.getElementById("gpuUsage");
const gpuDetails = document.getElementById("gpuDetails");
const gpuBar = document.getElementById("gpuBar");

const diskMetricCards = document.getElementById("diskMetricCards");

const systemUsername = document.getElementById("systemUsername");
const systemDeviceName = document.getElementById("systemDeviceName");
const systemOs = document.getElementById("systemOs");
const systemArchitecture = document.getElementById("systemArchitecture");
const systemCpuInfo = document.getElementById("systemCpuInfo");
const systemGpuInfo = document.getElementById("systemGpuInfo");
const systemRamInfo = document.getElementById("systemRamInfo");
const systemIpAddress = document.getElementById("systemIpAddress");
const systemDisksInfo = document.getElementById("systemDisksInfo");
const systemMonitorsInfo = document.getElementById("systemMonitorsInfo");
const systemPrintersInfo = document.getElementById("systemPrintersInfo");


const webRows = document.getElementById("webRows");
const screenContainer = document.getElementById("screenContainer");
const screenImage = document.getElementById("screenImage");
const screenEmpty = document.getElementById("screenEmpty");
const screenEmptyTitle = document.getElementById("screenEmptyTitle");
const screenEmptySub = document.getElementById("screenEmptySub");
const screenResolution = document.getElementById("screenResolution");
const screenSize = document.getElementById("screenSize");
const screenTimestamp = document.getElementById("screenTimestamp");
const screenNavigation = document.getElementById("screenNavigation");
const screenPrevBtn = document.getElementById("screenPrevBtn");
const screenNextBtn = document.getElementById("screenNextBtn");
const screenCounter = document.getElementById("screenCounter");
const screenMonitorLabel = document.getElementById("screenMonitorLabel");
const screenshotModal = document.getElementById("screenshotModal");
const screenshotModalBackdrop = document.getElementById("screenshotModalBackdrop");
const screenshotModalClose = document.getElementById("screenshotModalClose");
const screenshotModalImage = document.getElementById("screenshotModalImage");
const screenshotModalMeta = document.getElementById("screenshotModalMeta");

const ICONS = {
  chrome: "../icon/google-chrome.svg",
  edge: "../icon/microsoft-edge.svg",
  teams: "../icon/microsoft-teams.svg",
  vscode: "../icon/visual-studio-code.svg",
  telegram: "../icon/telegram.svg",
  explorer: "../icon/file-explorer.svg",
  onedrive: "../icon/microsoft-onedrive.svg",
  word: "../icon/microsoft-word.svg",
  excel: "../icon/microsoft-excel.svg",
  powerpoint: "../icon/microsoft-powerpoint.svg",
  copilot: "../icon/microsoft-copilot.svg",
  terminal: "../icon/windows-terminal.svg",
  defender: "../icon/microsoft-defender.svg",
  steam: "../icon/steam.svg",
  powershell: "../icon/powershell.svg",

  youtube: "../icon/youtube.svg",
  gmail: "../icon/gmail.svg",
  github: "../icon/github.svg",
  microsoft365: "../icon/microsoft-365.svg",
  google: "../icon/google.svg",
  vk: "../icon/vk.svg",
  kinopoisk: "../icon/kinopoisk.svg",
  tiktok: "../icon/tiktok.svg",
  linkedin: "../icon/linkedin.svg",
  twitch: "../icon/twitch.svg",
  nvidia: "../icon/nvidia.svg",
  chatgpt: "../icon/chatgpt.svg",

  ilovepdf: "../icon/ilovepdf.svg",
  dota2: "../icon/dota2.svg",
  valve: "../icon/valve.svg",
  discord: "../icon/discord.svg",
  amazon: "../icon/amazon.svg",
  cloudflare: "../icon/cloudflare.svg",
  yandex: "../icon/yandex.svg",

  ubisoft: "../icon/ubisoft.svg",
  redis: "../icon/redis.svg",
  python: "../icon/python.svg",
  postgresql: "../icon/postgresql.svg",
  obs: "../icon/obsstudio.svg",
  git: "../icon/git.svg",
  docker: "../icon/docker.svg",
  ollama: "../icon/ollama.svg",
  linux: "../icon/linux.svg"
};

const HOST_ICON_RULES = [
  { match: host => host === "youtube.com" || host.endsWith(".youtube.com"), icon: ICONS.youtube },
  { match: host => host === "mail.google.com", icon: ICONS.gmail },
  { match: host => host === "web.telegram.org" || host.endsWith(".telegram.org"), icon: ICONS.telegram },
  { match: host => host === "github.com" || host.endsWith(".github.com"), icon: ICONS.github },
  { match: host => host === "office.com" || host.endsWith(".office.com") || host === "microsoft365.com" || host.endsWith(".microsoft365.com"), icon: ICONS.microsoft365 },
  { match: host => host === "google.com" || host.endsWith(".google.com"), icon: ICONS.google },
  { match: host => host === "vk.com" || host.endsWith(".vk.com"), icon: ICONS.vk },
  { match: host => host === "kinopoisk.ru" || host.endsWith(".kinopoisk.ru"), icon: ICONS.kinopoisk },
  { match: host => host === "tiktok.com" || host.endsWith(".tiktok.com"), icon: ICONS.tiktok },
  { match: host => host === "linkedin.com" || host.endsWith(".linkedin.com"), icon: ICONS.linkedin },
  { match: host => host === "twitch.tv" || host.endsWith(".twitch.tv"), icon: ICONS.twitch },
  { match: host => host === "nvidia.com" || host.endsWith(".nvidia.com"), icon: ICONS.nvidia },
  { match: host => host === "ilovepdf.com" || host.endsWith(".ilovepdf.com"), icon: ICONS.ilovepdf },
  { match: host => host === "dota2.com" || host.endsWith(".dota2.com"), icon: ICONS.dota2 },
  { match: host => host === "steampowered.com" || host.endsWith(".steampowered.com") || host === "steamcommunity.com" || host.endsWith(".steamcommunity.com"), icon: ICONS.steam },
  { match: host => host === "valvesoftware.com" || host.endsWith(".valvesoftware.com"), icon: ICONS.valve },
  { match: host => host === "discord.com" || host.endsWith(".discord.com") || host === "discord.gg" || host.endsWith(".discord.gg"), icon: ICONS.discord },
  { match: host => host === "amazon.com" || host.endsWith(".amazon.com") || host.includes("amazon."), icon: ICONS.amazon },
  { match: host => host === "cloudflare.com" || host.endsWith(".cloudflare.com"), icon: ICONS.cloudflare },
  { match: host => host === "yandex.ru" || host.endsWith(".yandex.ru") || host === "yandex.com" || host.endsWith(".yandex.com"), icon: ICONS.yandex },
  { match: host => host === "ubisoft.com" || host.endsWith(".ubisoft.com"), icon: ICONS.ubisoft },
  { match: host => host === "redis.io" || host.endsWith(".redis.io"), icon: ICONS.redis },
  { match: host => host === "python.org" || host.endsWith(".python.org"), icon: ICONS.python },
  { match: host => host === "postgresql.org" || host.endsWith(".postgresql.org") || host === "pgadmin.org" || host.endsWith(".pgadmin.org"), icon: ICONS.postgresql },
  { match: host => host === "obsproject.com" || host.endsWith(".obsproject.com"), icon: ICONS.obs },
  { match: host => host === "git-scm.com" || host.endsWith(".git-scm.com"), icon: ICONS.git },
  { match: host => host === "docker.com" || host.endsWith(".docker.com"), icon: ICONS.docker },
  { match: host => host === "ollama.com" || host.endsWith(".ollama.com"), icon: ICONS.ollama },
  { match: host => host === "chatgpt.com" || host.endsWith(".chatgpt.com") || host === "openai.com" || host.endsWith(".openai.com"), icon: ICONS.chatgpt }
];

const NAME_ICON_RULES = [
  { terms: ["google chrome", "chrome", "chrome.exe"], icon: ICONS.chrome },
  { terms: ["microsoft edge", "msedge", "msedge.exe"], icon: ICONS.edge },
  { terms: ["microsoft teams", "teams", "ms-teams.exe"], icon: ICONS.teams },
  { terms: ["visual studio code", "vscode", "code.exe"], icon: ICONS.vscode },
  { terms: ["telegram desktop", "telegram", "telegram.exe"], icon: ICONS.telegram },
  { terms: ["windows explorer", "explorer.exe", "file explorer"], icon: ICONS.explorer },
  { terms: ["onedrive", "onedrive.exe"], icon: ICONS.onedrive },
  { terms: ["microsoft word", "winword.exe", "word"], icon: ICONS.word },
  { terms: ["microsoft excel", "excel.exe", "excel"], icon: ICONS.excel },
  { terms: ["microsoft powerpoint", "powerpnt.exe", "powerpoint"], icon: ICONS.powerpoint },
  { terms: ["microsoft copilot", "copilot.exe", "copilot"], icon: ICONS.copilot },
  { terms: ["windows terminal", "windowsterminal.exe"], icon: ICONS.terminal },
  { terms: ["microsoft defender", "msmpeng.exe", "defender"], icon: ICONS.defender },
  { terms: ["steam", "steam.exe"], icon: ICONS.steam },
  { terms: ["powershell", "powershell.exe", "pwsh"], icon: ICONS.powershell },

  { terms: ["youtube"], icon: ICONS.youtube },
  { terms: ["gmail"], icon: ICONS.gmail },
  { terms: ["github"], icon: ICONS.github },
  { terms: ["microsoft 365", "office 365", "microsoft365"], icon: ICONS.microsoft365 },
  { terms: ["google"], icon: ICONS.google },
  { terms: ["vk", "vkontakte", "вконтакте"], icon: ICONS.vk },
  { terms: ["kinopoisk", "кинопоиск"], icon: ICONS.kinopoisk },
  { terms: ["tiktok", "tik tok"], icon: ICONS.tiktok },
  { terms: ["linkedin"], icon: ICONS.linkedin },
  { terms: ["twitch"], icon: ICONS.twitch },
  { terms: ["nvidia", "geforce"], icon: ICONS.nvidia },
  { terms: ["i love pdf", "ilovepdf", "i-love-pdf", "love pdf"], icon: ICONS.ilovepdf },
  { terms: ["dota 2", "dota2", "dota"], icon: ICONS.dota2 },
  { terms: ["valve", "valve corporation"], icon: ICONS.valve },
  { terms: ["discord", "discord.exe"], icon: ICONS.discord },
  { terms: ["amazon", "amazon web services", "aws"], icon: ICONS.amazon },
  { terms: ["cloudflare"], icon: ICONS.cloudflare },
  { terms: ["yandex", "яндекс"], icon: ICONS.yandex },
  { terms: ["ubisoft", "ubisoft connect", "upc.exe"], icon: ICONS.ubisoft },
  { terms: ["redis", "redis-server", "redis-server.exe", "redisinsight"], icon: ICONS.redis },
  { terms: ["python", "python.exe", "pythonw.exe", "py.exe"], icon: ICONS.python },
  { terms: ["postgresql", "postgres", "postgres.exe", "pgadmin", "pgadmin 4"], icon: ICONS.postgresql },
  { terms: ["obs", "obs studio", "obs64.exe", "obs32.exe"], icon: ICONS.obs },
  { terms: ["git", "git.exe", "git bash", "git gui"], icon: ICONS.git },
  { terms: ["docker", "docker desktop", "docker.exe", "com.docker"], icon: ICONS.docker },
  { terms: ["ollama", "ollama.exe", "ollama app"], icon: ICONS.ollama },
  { terms: ["linux", "linux.exe", "wsl", "wsl.exe", "ubuntu"], icon: ICONS.linux },
  { terms: ["chatgpt", "chat gpt", "openai"], icon: ICONS.chatgpt }
];

function parseUrl(value){
  const raw = String(value || "").trim();
  if(!raw) return { raw: "", hostname: "", title: "Неизвестный сайт" };

  try{
    const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(normalized);
    const hostname = url.hostname.toLowerCase();
    return {
      raw,
      hostname,
      title: hostname.replace(/^www\./, "") || raw
    };
  }catch(_){
    return {
      raw,
      hostname: raw.toLowerCase(),
      title: raw
    };
  }
}


function iconFallbackLetter(name){
  return String(name || "?").trim().charAt(0).toUpperCase() || "?";
}

function renderMappedIcon(iconUrl, name){
  if(!iconUrl) return "";

  return `
    <img
      src="${iconUrl}"
      alt=""
      aria-hidden="true"
      loading="eager"
      decoding="async"
      onerror="this.closest('.item-icon')?.remove();"
    >
  `;
}

function siteIcon(hostname){
  const host = String(hostname || "").toLowerCase().replace(/^www\./, "");
  const rule = HOST_ICON_RULES.find(item => item.match(host));
  return rule?.icon || iconForName(host);
}

function normalizeIconText(value){
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "");
}

function iconTextTokens(value){
  return String(value || "")
    .toLowerCase()
    .replace(/\\/g, "/")
    .split(/[^a-z0-9а-яё.+-]+/gi)
    .filter(Boolean);
}

function iconTermMatches(rawValue, term){
  const raw = String(rawValue || "").toLowerCase();
  const termRaw = String(term || "").toLowerCase().trim();

  if(!termRaw) return false;

  const normalizedTerm = normalizeIconText(termRaw);
  if(!normalizedTerm) return false;

  const isPlainBrand = /^[a-z0-9а-яё]+$/i.test(termRaw);

  // redis must match "redis" as a token, not the "Redis" in
  // "Microsoft Visual C++ Redistributable".
  if(isPlainBrand){
    return iconTextTokens(raw).some(
      token => normalizeIconText(token) === normalizedTerm
    );
  }

  // Phrases / executable aliases can use normalized phrase matching.
  const normalizedText = normalizeIconText(raw);
  return raw.includes(termRaw) || normalizedText.includes(normalizedTerm);
}

function iconForName(...values){
  const sourceValues = values.filter(Boolean);

  const rule = NAME_ICON_RULES.find(item =>
    item.terms.some(term =>
      sourceValues.some(value => iconTermMatches(value, term))
    )
  );

  return rule?.icon || "";
}

function domainInitial(domain){
  return String(domain || "?").replace(/^www\./, "").charAt(0).toUpperCase() || "?";
}

function formatTrafficMb(value){
  const number = Number(value);
  if(!Number.isFinite(number)) return "0 MB";
  if(number >= 1024) return `${(number / 1024).toFixed(2)} GB`;
  return `${number.toFixed(number >= 10 ? 1 : 2)} MB`;
}

function formatApiDateTime(value){
  if(!value) return "—";
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ru-RU", {
    day:"2-digit",
    month:"2-digit",
    year:"numeric",
    hour:"2-digit",
    minute:"2-digit",
    second:"2-digit"
  }).format(date);
}


function formatDuration(firstSeenAt, lastSeenAt){
  if(!firstSeenAt || !lastSeenAt) return "—";

  const first = new Date(firstSeenAt);
  const last = new Date(lastSeenAt);

  if(Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) return "—";

  const diffMs = Math.max(0, last.getTime() - first.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  if(totalSeconds < 60){
    return totalSeconds === 0 ? "< 1 мин" : `${totalSeconds} сек`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if(hours > 0){
    return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
  }

  return `${totalMinutes} мин`;
}

function renderTrafficSummary(){
  const hasData = !trafficSummary.loading && !trafficSummary.error;

  if(trafficDownloadMetric){
    trafficDownloadMetric.textContent = hasData
      ? formatTrafficMb(trafficSummary.totalDownloadMb)
      : "—";
  }

  if(trafficUploadMetric){
    trafficUploadMetric.textContent = hasData
      ? formatTrafficMb(trafficSummary.totalUploadMb)
      : "—";
  }

  if(trafficPeriod){
    trafficPeriod.textContent = trafficSummary.loading
      ? "Загрузка данных..."
      : trafficSummary.error
        ? "API недоступен"
        : `${trafficSummary.fromDate} — ${trafficSummary.toDate}`;
  }

  if(!activityDescription) return;

  if(activeActivityTab !== "web"){
    activityDescription.classList.remove("traffic-summary");
    activityDescription.textContent = tabMeta[activeActivityTab].description;
    return;
  }

  activityDescription.classList.add("traffic-summary");

  if(trafficSummary.loading){
    activityDescription.textContent = "Получение данных интернет-трафика...";
    return;
  }

  if(trafficSummary.error){
    activityDescription.textContent = "Не удалось получить данные интернет-трафика";
    return;
  }

  activityDescription.textContent =
    `${trafficSummary.fromDate} — ${trafficSummary.toDate}`;
}

function renderWebHistory(query = ""){
  const q = query.toLowerCase().trim();
  const items = webHistory.filter(item =>
    `${item.title} ${item.url} ${item.hostname}`.toLowerCase().includes(q)
  );

  webRows.innerHTML = items.length ? items.map(item => `
    <tr>
      <td>
        <div class="item-main">
          ${item.icon ? `<div class="item-icon">${renderMappedIcon(item.icon, item.title || item.url)}</div>` : ""}
          <div>
            <div class="proc-name">${item.title}</div>
            <div class="url-text" title="${item.url}">${item.url}</div>
          </div>
        </div>
      </td>
      <td class="traffic-duration">${formatDuration(item.firstSeenAt, item.lastSeenAt)}</td>
      <td class="traffic-number download">${formatTrafficMb(item.downloadMb)}</td>
      <td class="traffic-number upload">${formatTrafficMb(item.uploadMb)}</td>
    </tr>
  `).join("") : `
    <tr class="table-empty">
      <td colspan="4">
        <div class="table-empty-title">Интернет-трафик отсутствует</div>
        <div class="table-empty-sub">Посещённые сайты появятся после получения данных от API</div>
      </td>
    </tr>
  `;
}



function clampPercent(value){
  const number = Number(value);
  if(!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function formatPercent(value){
  const number = Number(value);
  if(!Number.isFinite(number)) return "—";

  const rounded = Math.round(number * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function formatGb(value){
  const number = Number(value);
  if(!Number.isFinite(number) || number < 0) return "—";

  const decimals = number >= 10 ? 1 : 2;
  return `${number.toFixed(decimals)} GB`;
}

function setMetricBar(bar, value){
  if(!bar) return;
  bar.style.width = `${clampPercent(value)}%`;
}


function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanDisplayName(name){
  const raw = String(name || "").trim();
  // Windows APIs often return "\\.\DISPLAY1". Keep the source data
  // untouched, but present it as "DISPLAY1" in the UI.
  return raw.replace(/^\\\\\.\\/, "") || "Монитор";
}

function renderResourceList(target, items){
  if(!target) return;

  if(!items.length){
    target.textContent = "—";
    return;
  }

  target.innerHTML = `
    <div class="info-resource-list">
      ${items.map(item => `
        <span class="info-resource"${item.title ? ` title="${escapeHtml(item.title)}"` : ""}>
          ${escapeHtml(item.primary)}
          ${item.secondary
            ? `<span class="resource-secondary"> · ${escapeHtml(item.secondary)}</span>`
            : ""}
        </span>
      `).join("")}
    </div>
  `;
}


function updateSystemMetricsLayout(diskCount){
  const grid = document.getElementById("systemMetrics");
  if(!grid) return;

  const count = Math.max(0, Number(diskCount) || 0);

  if(window.matchMedia("(max-width: 1180px)").matches){
    grid.style.gridTemplateColumns = "";
    return;
  }

  const columns = [
    "1.18fr", // CPU
    "1.18fr", // RAM
    "1.18fr", // GPU
    ...Array.from({length: count}, () => ".76fr"),
    "1.52fr"  // Internet
  ];

  grid.style.gridTemplateColumns = columns.join(" ");
}

function renderDiskMetricCard(disk, index){
  const total = Number(disk?.total_gb);
  const usage = clampPercent(disk?.usage_percent);
  const used = Number.isFinite(total) ? total * usage / 100 : NaN;
  const name = String(disk?.name || `Диск ${index + 1}`).trim();

  const details = Number.isFinite(used) && Number.isFinite(total)
    ? `${formatGb(used)} / ${formatGb(total)}`
    : Number.isFinite(total)
      ? formatGb(total)
      : "Нет данных";

  return `
    <div class="metric metric-disk">
      <div class="metric-head">
        <span class="metric-title" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
        <span class="metric-chip">Диск</span>
      </div>
      <div class="metric-body">
        <div class="metric-val">${formatPercent(disk?.usage_percent)}</div>
        <div class="metric-sub">${escapeHtml(details)}</div>
      </div>
      <div class="bar"><span style="width:${usage}%"></span></div>
    </div>
  `;
}

function resetSystemMetrics(message = "Нет данных"){
  if(cpuUsage) cpuUsage.textContent = "—";
  if(cpuDetails) cpuDetails.textContent = message;
  setMetricBar(cpuBar, 0);

  if(ramUsage) ramUsage.textContent = "—";
  if(ramDetails) ramDetails.textContent = message;
  setMetricBar(ramBar, 0);

  if(gpuUsage) gpuUsage.textContent = "—";
  if(gpuDetails) gpuDetails.textContent = message;
  setMetricBar(gpuBar, 0);

  if(diskMetricCards){
    diskMetricCards.innerHTML = `
      <div class="metric metric-disk">
        <div class="metric-head">
          <span class="metric-title">Диск</span>
          <span class="metric-chip">Диск</span>
        </div>
        <div class="metric-body">
          <div class="metric-val">—</div>
          <div class="metric-sub">${escapeHtml(message)}</div>
        </div>
        <div class="bar"><span style="width:0%"></span></div>
      </div>
    `;
  }

  [
    systemUsername,
    systemDeviceName,
    systemOs,
    systemArchitecture,
    systemCpuInfo,
    systemGpuInfo,
    systemRamInfo,
    systemIpAddress,
    systemDisksInfo,
    systemMonitorsInfo,
    systemPrintersInfo
  ].forEach(element => {
    if(element) element.textContent = "—";
  });
}

function renderSystemCurrent(data){
  const cpu = data?.cpu || {};
  const gpu = data?.gpu || {};
  const ram = data?.ram || {};
  const disks = Array.isArray(data?.disks) ? data.disks : [];
  const monitors = Array.isArray(data?.monitors) ? data.monitors : [];
  const printers = Array.isArray(data?.printers) ? data.printers : [];

  // CPU
  if(cpuUsage) cpuUsage.textContent = formatPercent(cpu.usage_percent);
  if(cpuDetails) cpuDetails.textContent = cpu.model || "Нет данных";
  setMetricBar(cpuBar, cpu.usage_percent);

  // RAM
  const ramTotal = Number(ram.total_gb);
  const ramPercent = clampPercent(ram.usage_percent);
  const ramUsed = Number.isFinite(ramTotal)
    ? ramTotal * ramPercent / 100
    : NaN;

  if(ramUsage) ramUsage.textContent = formatPercent(ram.usage_percent);

  const ramParts = [];
  if(Number.isFinite(ramUsed) && Number.isFinite(ramTotal)){
    ramParts.push(`${formatGb(ramUsed)} / ${formatGb(ramTotal)}`);
  }else if(Number.isFinite(ramTotal)){
    ramParts.push(formatGb(ramTotal));
  }
  if(ram.generation){
    ramParts.push(String(ram.generation));
  }
  if(Number(ram.speed_mhz) > 0){
    ramParts.push(`${ram.speed_mhz} MHz`);
  }

  if(ramDetails) ramDetails.textContent = ramParts.join(" · ") || "Нет данных";
  setMetricBar(ramBar, ram.usage_percent);

  // GPU
  if(gpuUsage) gpuUsage.textContent = formatPercent(gpu.usage_percent);
  if(gpuDetails) gpuDetails.textContent = gpu.model || "Нет данных";
  setMetricBar(gpuBar, gpu.usage_percent);

  // Disks
  if(diskMetricCards){
    diskMetricCards.innerHTML = disks.length
      ? disks.map(renderDiskMetricCard).join("")
      : renderDiskMetricCard({}, 0);

    updateSystemMetricsLayout(disks.length || 1);
  }

  // Page title
  const deviceName = String(data?.device_name || "").trim();
  const titleEl = document.getElementById("deviceTitle");
  if(titleEl){
    titleEl.textContent = deviceName || "Устройство";
  }

  // System information
  if(systemUsername) systemUsername.textContent = data?.username || "—";
  if(systemDeviceName) systemDeviceName.textContent = deviceName || "—";
  if(systemOs) systemOs.textContent = data?.os || "—";
  if(systemArchitecture) systemArchitecture.textContent = data?.architecture || "—";
  if(systemCpuInfo) systemCpuInfo.textContent = cpu.model || "—";
  if(systemGpuInfo) systemGpuInfo.textContent = gpu.model || "—";

  if(systemRamInfo){
    const info = [
      ram.generation || "",
      Number.isFinite(ramTotal) ? formatGb(ramTotal) : "",
      Number(ram.speed_mhz) > 0 ? `${ram.speed_mhz} MHz` : ""
    ].filter(Boolean).join(" ");

    systemRamInfo.textContent = info || "—";
  }

  if(systemIpAddress){
    systemIpAddress.textContent = data?.ip_address || "—";
  }

  if(systemDisksInfo){
    renderResourceList(
      systemDisksInfo,
      disks.map((disk, index) => ({
        primary: String(disk?.name || `Диск ${index + 1}`).trim(),
        secondary: Number.isFinite(Number(disk?.total_gb))
          ? formatGb(disk.total_gb)
          : ""
      }))
    );
  }

  if(systemMonitorsInfo){
    renderResourceList(
      systemMonitorsInfo,
      monitors.map((monitor, index) => {
        const rawName = String(monitor?.name || `Монитор ${index + 1}`).trim();
        const width = Number(monitor?.width);
        const height = Number(monitor?.height);

        return {
          primary: cleanDisplayName(rawName),
          secondary: width > 0 && height > 0 ? `${width}×${height}` : "",
          title: rawName
        };
      })
    );
  }

  if(systemPrintersInfo){
    renderResourceList(
      systemPrintersInfo,
      printers.map((printer, index) => ({
        primary: String(printer?.name || `Принтер ${index + 1}`).trim(),
        secondary: ""
      }))
    );
  }
}

async function loadSystemCurrent(){
  try{
    const response = await fetch(SYSTEM_URL, {
      method:"GET",
      cache:"no-store"
    });

    if(!response.ok){
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderSystemCurrent(data);
  }catch(error){
    resetSystemMetrics("API недоступен");
    console.error("System API error:", error);
  }
}

function screenshotDataUrl(base64){
  if(base64 === null || base64 === undefined) return "";

  const value = String(base64).trim();
  if(!value) return "";

  if(value.startsWith("data:image/")){
    return value;
  }

  return `data:image/png;base64,${value}`;
}

function formatScreenshotSize(value){
  const size = Number(value);
  if(!Number.isFinite(size) || size <= 0) return "—";
  return `${size.toFixed(size >= 10 ? 1 : 2)} MB`;
}

function updateScreenshotNavigation(){
  const total = screenshots.length;
  const multiple = total > 1;

  if(screenNavigation){
    screenNavigation.hidden = !multiple;
  }

  if(screenCounter){
    screenCounter.textContent = total
      ? `${currentScreenshotIndex + 1} / ${total}`
      : "0 / 0";
  }

  if(screenPrevBtn){
    screenPrevBtn.disabled = !multiple || currentScreenshotIndex <= 0;
  }

  if(screenNextBtn){
    screenNextBtn.disabled = !multiple || currentScreenshotIndex >= total - 1;
  }
}

function renderScreenshot(index){
  if(!screenshots.length){
    screenImage.hidden = true;
    screenContainer.classList.remove("has-image");
    screenEmptyTitle.textContent = "Скриншот недоступен";
    screenEmptySub.textContent = "API не вернул данные об экранах";
    screenResolution.textContent = "—";
    if(screenSize) screenSize.textContent = "—";
    screenTimestamp.textContent = "Нет данных";
    if(screenMonitorLabel) screenMonitorLabel.hidden = true;
    updateScreenshotNavigation();
    return;
  }

  currentScreenshotIndex = Math.max(
    0,
    Math.min(screenshots.length - 1, Number(index) || 0)
  );

  const screenshot = screenshots[currentScreenshotIndex];
  const width = Number(screenshot.width);
  const height = Number(screenshot.height);

  screenResolution.textContent =
    width > 0 && height > 0 ? `${width} × ${height}` : "—";

  if(screenSize){
    screenSize.textContent = formatScreenshotSize(screenshot.sizeMb);
  }

  screenTimestamp.textContent = screenshot.timestamp
    ? formatApiDateTime(screenshot.timestamp)
    : "—";

  if(screenMonitorLabel){
    // Display numbering is always 1..N in UI, regardless of raw API monitor id.
    screenMonitorLabel.textContent = `Монитор ${currentScreenshotIndex + 1}`;
    screenMonitorLabel.hidden = false;
  }

  if(screenshot.src){
    screenImage.src = screenshot.src;
    screenImage.alt = Number.isFinite(Number(screenshot.monitor))
      ? `Скриншот монитора ${Number(screenshot.monitor) + 1}`
      : `Скриншот монитора ${currentScreenshotIndex + 1}`;
    screenImage.hidden = false;
    screenContainer.classList.add("has-image");
    screenEmptyTitle.classList.remove("api-error");
  }else{
    // base64 can legally be null according to the API schema.
    screenImage.removeAttribute("src");
    screenImage.hidden = true;
    screenContainer.classList.remove("has-image");

    screenEmptyTitle.textContent = "Скриншот недоступен";
    screenEmptySub.textContent = "Для этого монитора API вернул base64: null";
    screenEmptyTitle.classList.remove("api-error");
  }

  updateScreenshotNavigation();

  if(screenshotModal && !screenshotModal.hidden && screenshot.src){
    screenshotModalImage.src = screenshot.src;
    screenshotModalImage.alt = `Скриншот монитора ${currentScreenshotIndex + 1}`;
  }
}

async function loadScreenshots(){
  screenEmptyTitle.textContent = "Загрузка скриншотов...";
  screenEmptySub.textContent = "Получение изображений с устройства";
  screenEmptyTitle.classList.remove("api-error");

  screenImage.hidden = true;
  screenContainer.classList.remove("has-image");

  try{
    const response = await fetch(SCREENSHOT_META_URL, {
      method:"GET",
      cache:"no-store"
    });

    if(!response.ok){
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if(!Array.isArray(data)){
      throw new Error("Ожидался массив скриншотов");
    }

    screenshots = data.map((item, index) => ({
      monitor: Number.isFinite(Number(item?.monitor))
        ? Number(item.monitor)
        : index,
      width: Number(item?.width) || 0,
      height: Number(item?.height) || 0,
      sizeMb: Number(item?.size_mb) || 0,
      timestamp: item?.timestamp || null,
      base64: item?.base64 ?? null,
      src: screenshotDataUrl(item?.base64)
    }));

    currentScreenshotIndex = 0;
    renderScreenshot(0);
  }catch(error){
    screenshots = [];
    currentScreenshotIndex = 0;

    screenImage.removeAttribute("src");
    screenImage.hidden = true;
    screenContainer.classList.remove("has-image");

    screenEmptyTitle.textContent = "Скриншоты недоступны";
    screenEmptySub.textContent = "Не удалось получить /screenshot/current";
    screenEmptyTitle.classList.add("api-error");

    screenResolution.textContent = "—";
    if(screenSize) screenSize.textContent = "—";
    screenTimestamp.textContent = "API недоступен";
    if(screenMonitorLabel) screenMonitorLabel.hidden = true;

    updateScreenshotNavigation();
    console.error("Screenshot API error:", error);
  }
}

if(screenPrevBtn){
  screenPrevBtn.addEventListener("click", () => {
    if(currentScreenshotIndex > 0){
      renderScreenshot(currentScreenshotIndex - 1);
    }
  });
}

if(screenNextBtn){
  screenNextBtn.addEventListener("click", () => {
    if(currentScreenshotIndex < screenshots.length - 1){
      renderScreenshot(currentScreenshotIndex + 1);
    }
  });
}


function openScreenshotModal(){
  if(!screenshots.length || !screenImage || screenImage.hidden || !screenImage.src) return;

  const screenshot = screenshots[currentScreenshotIndex];

  screenshotModalImage.src = screenImage.src;
  screenshotModalImage.alt = `Скриншот монитора ${currentScreenshotIndex + 1}`;

  if(screenshotModalMeta){
    const resolution =
      Number(screenshot.width) > 0 && Number(screenshot.height) > 0
        ? `${screenshot.width} × ${screenshot.height}`
        : "—";

    const size = formatScreenshotSize(screenshot.sizeMb);
    const time = screenshot.timestamp ? formatApiDateTime(screenshot.timestamp) : "—";

    screenshotModalMeta.textContent =
      `Монитор ${currentScreenshotIndex + 1} · ${resolution} · ${size} · ${time}`;
  }

  screenshotModal.hidden = false;
  screenshotModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  screenshotModalClose?.focus();
}

function closeScreenshotModal(){
  if(!screenshotModal) return;

  screenshotModal.hidden = true;
  screenshotModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  screenImage?.focus();
}

if(screenImage){
  screenImage.addEventListener("click", openScreenshotModal);
  screenImage.addEventListener("keydown", event => {
    if(event.key === "Enter" || event.key === " "){
      event.preventDefault();
      openScreenshotModal();
    }
  });
}

screenshotModalClose?.addEventListener("click", closeScreenshotModal);
screenshotModalBackdrop?.addEventListener("click", closeScreenshotModal);

document.addEventListener("keydown", event => {
  if(event.key === "Escape" && screenshotModal && !screenshotModal.hidden){
    closeScreenshotModal();
  }
});



let trafficScanStarted = false;

async function startInternetTrafficScan(){
  if(trafficScanStarted) return;

  trafficScanStarted = true;

  try{
    const response = await fetch(TRAFFIC_RUN_SCAN_URL, {
      method:"GET",
      cache:"no-store"
    });

    if(!response.ok){
      throw new Error(`HTTP ${response.status}`);
    }
  }catch(error){
    // Scanner startup must not break the rest of the device page.
    console.error("Traffic scan start error:", error);
  }
}

async function loadInternetTraffic(){
  trafficSummary = {
    ...trafficSummary,
    loading: true,
    error: false
  };
  renderTrafficSummary();

  try{
    const response = await fetch(TRAFFIC_URL, {
      method:"GET",
      cache:"no-store"
    });

    if(!response.ok){
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const rows = Array.isArray(data?.by_url) ? data.by_url : [];

    webHistory = rows.map(item => {
      const parsed = parseUrl(item.url);

      return {
        title: parsed.title,
        url: parsed.raw,
        hostname: parsed.hostname,
        icon: siteIcon(parsed.hostname) || iconForName(parsed.title, parsed.raw, parsed.hostname),
        uploadMb: Number(item.total_upload_mb) || 0,
        downloadMb: Number(item.total_download_mb) || 0,
        firstSeenAt: item.first_seen_at || null,
        lastSeenAt: item.last_seen_at || null
      };
    });

    trafficSummary = {
      fromDate: data?.from_date || "—",
      toDate: data?.to_date || "—",
      totalDownloadMb: Number(data?.total_download_mb) || 0,
      totalUploadMb: Number(data?.total_upload_mb) || 0,
      loading: false,
      error: false
    };

    renderTrafficSummary();

    if(activeActivityTab === "web"){
      renderWebHistory(activitySearch.value);
    }else{
      renderWebHistory("");
    }
  }catch(error){
    webHistory = [];
    trafficSummary = {
      ...trafficSummary,
      loading: false,
      error: true
    };

    renderTrafficSummary();
    renderWebHistory(activitySearch?.value || "");
    console.error("Traffic API error:", error);
  }
}



const procRows = document.getElementById("procRows");


function clampProgramPercent(value){
  const number = Number(value);
  if(!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function displayProgramStatus(status){
  const normalized = String(status || "").trim().toLowerCase();

  const map = {
    running: "Работает",
    active: "Работает",
    sleeping: "Ожидание",
    idle: "Ожидание",
    stopped: "Остановлен",
    terminated: "Завершён",
    zombie: "Завершён",
    suspended: "Приостановлен"
  };

  return map[normalized] || String(status || "—");
}

function sanitizeInstalledProgramName(name, publisher = ""){
  const raw = String(name || "").trim();

  // Windows Installer/ARP can expose unresolved resource placeholders.
  const looksLikePlaceholder =
    !raw ||
    /\$\{\{.*?\}\}/.test(raw) ||
    /^@\{.*?\}$/.test(raw) ||
    /^\$\([^)]*\)$/.test(raw);

  if(!looksLikePlaceholder) return raw;

  const pub = String(publisher || "").trim();
  if(pub) return `${pub} software`;

  return "Неизвестная программа";
}

function shouldHideInstalledProgram(program){
  const raw = String(program?.name || "").trim();

  // Completely empty/unresolved rows without useful metadata add no value.
  const placeholder = /\$\{\{.*?\}\}/.test(raw) || /^@\{.*?\}$/.test(raw);
  const hasUsefulMeta =
    String(program?.version || "").trim() ||
    String(program?.publisher || "").trim() ||
    String(program?.installed_at || "").trim();

  return placeholder && !hasUsefulMeta;
}

function formatProgramPercent(value){
  const number = clampProgramPercent(value);
  const rounded = Math.round(number * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function formatProgramDate(value, includeTime = false){
  if(!value) return "—";

  // YYYY-MM-DD can be displayed without timezone conversion.
  if(!includeTime && /^\d{4}-\d{2}-\d{2}$/.test(String(value))){
    const [year, month, day] = String(value).split("-");
    return `${day}.${month}.${year}`;
  }

  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return String(value);

  const options = includeTime
    ? {
        day:"2-digit",
        month:"2-digit",
        year:"numeric",
        hour:"2-digit",
        minute:"2-digit"
      }
    : {
        day:"2-digit",
        month:"2-digit",
        year:"numeric"
      };

  return new Intl.DateTimeFormat("ru-RU", options).format(date);
}

function runningStatusClass(status){
  const normalized = String(status || "").trim().toLowerCase();

  if(
    normalized === "running" ||
    normalized === "работает" ||
    normalized === "active"
  ){
    return "green";
  }

  return "gray";
}

async function loadRunningPrograms(){
  if(runningProgramsLoaded){
    renderProcesses(activitySearch?.value || "");
    return processes;
  }

  if(runningProgramsRequest){
    return runningProgramsRequest;
  }

  runningProgramsLoading = true;
  runningProgramsError = false;

  if(activeActivityTab === "processes"){
    renderProcesses(activitySearch?.value || "");
  }

  runningProgramsRequest = (async () => {
    try{
      const response = await fetch(RUNNING_PROGRAMS_URL, {
        method:"GET",
        cache:"no-store"
      });

      if(!response.ok){
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if(!Array.isArray(data)){
        throw new Error("Ожидался массив запущенных программ");
      }

      processes = data.map(item => ({
        pid: Number(item?.pid) || 0,
        name: String(item?.name || "Неизвестная программа"),
        path: String(item?.path || ""),
        cpuPercent: clampProgramPercent(item?.cpu_percent),
        memoryPercent: clampProgramPercent(item?.memory_percent),
        gpuPercent: clampProgramPercent(item?.gpu_percent),
        status: String(item?.status || "—"),
        startedAt: item?.started_at || null,
        icon: iconForName(item?.name, item?.path)
      }));

      runningProgramsLoaded = true;
      runningProgramsError = false;
      return processes;
    }catch(error){
      processes = [];
      runningProgramsError = true;
      console.error("Running programs API error:", error);
      return processes;
    }finally{
      runningProgramsLoading = false;
      runningProgramsRequest = null;

      if(activeActivityTab === "processes"){
        renderProcesses(activitySearch?.value || "");
      }
    }
  })();

  return runningProgramsRequest;
}

async function loadInstalledPrograms(){
  installedProgramsLoading = true;
  installedProgramsError = false;

  if(activeActivityTab === "installed"){
    renderInstalled(activitySearch?.value || "");
  }

  try{
    const response = await fetch(INSTALLED_PROGRAMS_URL, {
      method:"GET",
      cache:"no-store"
    });

    if(!response.ok){
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if(!Array.isArray(data)){
      throw new Error("Ожидался массив установленных программ");
    }

    installedPrograms = data
      .filter(item => !shouldHideInstalledProgram(item))
      .map(item => {
        const publisher = String(item?.publisher || "—");
        const name = sanitizeInstalledProgramName(item?.name, publisher === "—" ? "" : publisher);

        return {
          name,
          version: String(item?.version || "—"),
          publisher,
          installedAt: item?.installed_at || null,
          icon: iconForName(name, publisher, item?.name)
        };
      });

    installedProgramsError = false;
  }catch(error){
    installedPrograms = [];
    installedProgramsError = true;
    console.error("Installed programs API error:", error);
  }finally{
    installedProgramsLoading = false;

    if(activeActivityTab === "installed"){
      renderInstalled(activitySearch?.value || "");
    }
  }
}

function renderProcesses(query = ""){
  if(!procRows) return;

  if(runningProgramsLoading){
    procRows.innerHTML = `
      <tr class="table-empty">
        <td colspan="7">
          <div class="table-empty-title">Загрузка...</div>
          <div class="table-empty-sub">Получение списка запущенных программ</div>
        </td>
      </tr>
    `;
    return;
  }

  if(runningProgramsError){
    procRows.innerHTML = `
      <tr class="table-empty">
        <td colspan="7">
          <div class="table-empty-title">Не удалось получить процессы</div>
          <div class="table-empty-sub">API /system/running-programs недоступен</div>
        </td>
      </tr>
    `;
    return;
  }

  const q = query.toLowerCase().trim();
  const items = processes.filter(program =>
    `${program.name} ${program.path} ${program.pid} ${program.status}`
      .toLowerCase()
      .includes(q)
  );

  procRows.innerHTML = items.length ? items.map(program => {
    const icon = program.icon || iconForName(program.name, program.path);

    return `
      <tr>
        <td>
          <div class="item-main">
            ${icon ? `<div class="item-icon">${renderMappedIcon(icon, program.name)}</div>` : ""}
            <div class="program-text">
              <div class="proc-name">${program.name}</div>
              <div class="proc-sub program-path" title="${program.path}">${program.path || "—"}</div>
            </div>
          </div>
        </td>
        <td>${program.pid}</td>
        <td>${formatProgramPercent(program.cpuPercent)}</td>
        <td>${formatProgramPercent(program.memoryPercent)}</td>
        <td>${formatProgramPercent(program.gpuPercent)}</td>
        <td>
          <span class="badge ${runningStatusClass(program.status)}">
            ${displayProgramStatus(program.status)}
          </span>
        </td>
        <td>${formatProgramDate(program.startedAt, true)}</td>
      </tr>
    `;
  }).join("") : `
    <tr class="table-empty">
      <td colspan="7">
        <div class="table-empty-title">${q ? "Ничего не найдено" : "Нет запущенных программ"}</div>
        <div class="table-empty-sub">${q ? "Измени поисковый запрос" : "Активные приложения появятся здесь"}</div>
      </td>
    </tr>
  `;
}

const copySpecsBtn = document.getElementById("copySpecsBtn");
const copySpecsIcon = document.getElementById("copySpecsIcon");

copySpecsBtn.addEventListener("click", async () => {
  const specs = [...document.querySelectorAll(".info-grid .info-item")]
    .map(item => {
      const label = item.querySelector(".info-label")?.textContent.trim() || "";
      const value = item.querySelector(".info-value")?.textContent.trim() || "";
      return label && value && value !== "—" ? `${label}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n") || "Нет данных";

  try {
    await navigator.clipboard.writeText(specs);
  } catch (err) {
    const textarea = document.createElement("textarea");
    textarea.value = specs;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  copySpecsBtn.classList.add("copied");
  copySpecsBtn.title = "Скопировано";
  copySpecsBtn.setAttribute("aria-label", "Скопировано");
  copySpecsIcon.innerHTML = '<path d="m5 12 4 4L19 6"></path>';

  setTimeout(() => {
    copySpecsBtn.classList.remove("copied");
    copySpecsBtn.title = "Скопировать характеристики";
    copySpecsBtn.setAttribute("aria-label", "Скопировать характеристики");
    copySpecsIcon.innerHTML = '<rect x="9" y="9" width="10" height="10" rx="2"></rect><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"></path>';
  }, 1800);
});

const installedRows = document.getElementById("installedRows");
function renderInstalled(query = ""){
  if(!installedRows) return;

  if(installedProgramsLoading){
    installedRows.innerHTML = `
      <tr class="table-empty">
        <td colspan="4">
          <div class="table-empty-title">Загрузка...</div>
          <div class="table-empty-sub">Получение списка установленных программ</div>
        </td>
      </tr>
    `;
    return;
  }

  if(installedProgramsError){
    installedRows.innerHTML = `
      <tr class="table-empty">
        <td colspan="4">
          <div class="table-empty-title">Не удалось получить программы</div>
          <div class="table-empty-sub">API /system/installed-programs недоступен</div>
        </td>
      </tr>
    `;
    return;
  }

  const q = query.toLowerCase().trim();
  const items = installedPrograms.filter(program =>
    `${program.name} ${program.version} ${program.publisher}`
      .toLowerCase()
      .includes(q)
  );

  installedRows.innerHTML = items.length ? items.map(program => {
    const icon = program.icon || iconForName(program.name, program.publisher);

    return `
      <tr>
        <td>
          <div class="item-main">
            ${icon ? `<div class="item-icon">${renderMappedIcon(icon, program.name)}</div>` : ""}
            <div class="proc-name">${program.name}</div>
          </div>
        </td>
        <td>${program.version}</td>
        <td>${program.publisher}</td>
        <td>${formatProgramDate(program.installedAt)}</td>
      </tr>
    `;
  }).join("") : `
    <tr class="table-empty">
      <td colspan="4">
        <div class="table-empty-title">${q ? "Ничего не найдено" : "Установленные программы отсутствуют"}</div>
        <div class="table-empty-sub">${q ? "Измени поисковый запрос" : "Список программ появится здесь"}</div>
      </td>
    </tr>
  `;
}


const activitySearch = document.getElementById("activitySearch");
const activityTitle = document.getElementById("activityTitle");
const activityDescription = document.getElementById("activityDescription");
const activityTabs = document.querySelectorAll(".activity-tab");
const activityViews = {
  processes: document.getElementById("processesView"),
  web: document.getElementById("webView"),
  installed: document.getElementById("installedView")
};

const tabMeta = {
  processes: {
    title: "Запущенный софт",
    description: "Активные приложения и процессы на устройстве",
    placeholder: "Поиск процесса..."
  },
  web: {
    title: "Интернет-трафик",
    description: "Загрузка данных интернет-трафика...",
    placeholder: "Поиск сайта или URL..."
  },
  installed: {
    title: "Установленные программы",
    description: "Программное обеспечение, установленное на устройстве",
    placeholder: "Поиск программы..."
  }
};

let activeActivityTab = "processes";

function renderActiveActivity(){
  const query = activitySearch.value;
  if(activeActivityTab === "processes") renderProcesses(query);
  if(activeActivityTab === "web") renderWebHistory(query);
  if(activeActivityTab === "installed") renderInstalled(query);
}

activityTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    activeActivityTab = tab.dataset.tab;

    activityTabs.forEach(item => {
      const selected = item === tab;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
    });
    Object.entries(activityViews).forEach(([key, view]) => {
      view.classList.toggle("active", key === activeActivityTab);
    });

    const meta = tabMeta[activeActivityTab];
    activityTitle.textContent = meta.title;
    activitySearch.placeholder = meta.placeholder;
    activitySearch.value = "";

    renderTrafficSummary();

    renderActiveActivity();
  });
});

activitySearch.addEventListener("input", renderActiveActivity);

renderWebHistory();

const requestedDeviceId = new URLSearchParams(window.location.search).get("id");
if(requestedDeviceId){
  const deviceTitle = document.getElementById("deviceTitle");
  if(deviceTitle) deviceTitle.textContent = requestedDeviceId;
}

loadSystemCurrent();
loadScreenshots();
startInternetTrafficScan();
loadInternetTraffic();
loadRunningPrograms();
loadInstalledPrograms();

const internetTrafficRefreshInterval = window.setInterval(() => {
  loadInternetTraffic();
}, 60_000);

initInterfaceScale();




window.addEventListener("resize", () => {
  const diskCount = document.querySelectorAll("#diskMetricCards .metric-disk").length || 1;
  updateSystemMetricsLayout(diskCount);
});


window.addEventListener("beforeunload", () => {
  window.clearInterval(internetTrafficRefreshInterval);
});
