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


const devices = [];

const rows = document.getElementById("deviceRows");
const search = document.getElementById("search");
const shownText = document.getElementById("shownText");

function getSelectValue(name){
  const select = document.querySelector(`.custom-select[data-name="${name}"]`);
  return select ? (select.dataset.value || "") : "";
}

function setSelectValue(name, value, label){
  const select = document.querySelector(`.custom-select[data-name="${name}"]`);
  if(!select) return;
  select.dataset.value = value;
  select.querySelector(".select-trigger").textContent = label;
  select.querySelectorAll(".select-option").forEach(opt => {
    opt.classList.toggle("active", opt.dataset.value === value);
  });
}


function populateDepartmentOptions(){
  const container = document.getElementById("departmentOptions");
  if(!container) return;

  const departments = [...new Set(
    devices
      .map(device => (device.group || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "ru"));

  container.innerHTML = `
    <div class="select-option active" data-value="" data-label="Отдел: Все">Отдел: Все</div>
    ${departments.map(group => `
      <div class="select-option" data-value="${group}" data-label="Отдел: ${group}">${group}</div>
    `).join("")}
  `;
}

function updateSummary(){
  const total = devices.length;
  const online = devices.filter(device => device.status === "Онлайн").length;
  const offline = devices.filter(device => device.status === "Офлайн").length;

  const totalEl = document.getElementById("totalDevices");
  const onlineEl = document.getElementById("onlineDevices");
  const offlineEl = document.getElementById("offlineDevices");

  if(totalEl) totalEl.textContent = total;
  if(onlineEl) onlineEl.textContent = online;
  if(offlineEl) offlineEl.textContent = offline;
}

function initCustomSelects(){
  document.querySelectorAll(".custom-select").forEach(select => {
    const trigger = select.querySelector(".select-trigger");
    const options = select.querySelectorAll(".select-option");
    const searchInput = select.querySelector(".select-search");
    const emptyState = select.querySelector(".empty-option");

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".custom-select.open").forEach(other => {
        if(other !== select) other.classList.remove("open");
      });
      select.classList.toggle("open");
      if(select.classList.contains("open") && searchInput){
        setTimeout(() => searchInput.focus(), 30);
      }
    });

    if(searchInput){
      searchInput.addEventListener("click", (e) => e.stopPropagation());
      searchInput.addEventListener("input", () => {
        const q = searchInput.value.toLowerCase().trim();
        let visibleCount = 0;
        options.forEach(option => {
          const text = option.textContent.toLowerCase();
          const match = !q || text.includes(q);
          option.style.display = match ? "flex" : "none";
          if(match) visibleCount++;
        });
        if(emptyState) emptyState.style.display = visibleCount ? "none" : "block";
      });
    }

    options.forEach(option => {
      option.addEventListener("click", () => {
        setSelectValue(select.dataset.name, option.dataset.value, option.dataset.label);
        select.classList.remove("open");
        if(searchInput){
          searchInput.value = "";
          options.forEach(opt => opt.style.display = "flex");
          if(emptyState) emptyState.style.display = "none";
        }
        render();
      });
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".custom-select.open").forEach(select => select.classList.remove("open"));
  });
}

function statusClass(status){
  if(status === "Онлайн") return "online";
  if(status === "Офлайн") return "offline";
  return "";
}

function render(){
  const q = search.value.toLowerCase().trim();
  const sf = getSelectValue("status");
  const of = getSelectValue("os");
  const gf = getSelectValue("group");

  const filtered = devices.filter(d => {
    const hay = `${d.name} ${d.model} ${d.user} ${d.os} ${d.ip} ${d.group} ${d.status}`.toLowerCase();
    return (!q || hay.includes(q)) &&
           (!sf || d.status === sf) &&
           (!of || d.os === of) &&
           (!gf || d.group === gf);
  });

  rows.innerHTML = filtered.length ? filtered.map(d => `
    <tr class="device-row" data-device-id="${d.id ?? d.name}">
      <td>
        <div class="device-cell">
          <div>
            <div class="device-name">${d.name}</div>
            <div class="device-model">${d.model}</div>
          </div>
        </div>
      </td>
      <td>${d.user}</td>
      <td>
        <div class="os-wrap">
          <div>${d.os}</div>
          <div class="device-model">${d.ver}</div>
        </div>
      </td>
      <td>${d.ip}</td>
      <td>${d.group}</td>
      <td><span class="status ${statusClass(d.status)}">${d.status}</span></td>
    </tr>
  `).join("") : `
    <tr class="empty-row">
      <td colspan="6">
        <div class="empty-state">
          <div class="empty-state-title">Устройства отсутствуют</div>
          <div class="empty-state-sub">После подключения устройств они появятся здесь</div>
        </div>
      </td>
    </tr>
  `;

  shownText.textContent = filtered.length ? `Показано 1–${filtered.length} из ${filtered.length}` : "Нет устройств";

  const countLabel = document.querySelector(".footer .muted-note");
  if(countLabel) countLabel.textContent = `${filtered.length} устройств`;
}

document.getElementById("resetBtn").addEventListener("click", () => {
  search.value = "";
  setSelectValue("status", "", "Статус: Все");
  setSelectValue("os", "", "ОС: Все");
  setSelectValue("group", "", "Отдел: Все");

  const groupSelect = document.querySelector('.custom-select[data-name="group"]');
  if(groupSelect){
    const searchInput = groupSelect.querySelector(".select-search");
    const emptyState = groupSelect.querySelector(".empty-option");
    groupSelect.querySelectorAll(".select-option").forEach(opt => opt.style.display = "flex");
    if(searchInput) searchInput.value = "";
    if(emptyState) emptyState.style.display = "none";
  }

  render();
});

search.addEventListener("input", render);

populateDepartmentOptions();
initCustomSelects();
updateSummary();
render();

rows.addEventListener("click", event => {
  const row = event.target.closest(".device-row");
  if(!row) return;
  const deviceId = row.dataset.deviceId || "";
  const query = deviceId ? `?id=${encodeURIComponent(deviceId)}` : "";
  window.location.href = `../device/index.html${query}`;
});

initInterfaceScale();
