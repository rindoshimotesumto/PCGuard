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



const backBtn = document.getElementById("backBtn");
if(backBtn){
  backBtn.addEventListener("click", () => {
    if(window.history.length > 1){
      window.history.back();
    }else{
      window.location.href = "../dashboard/index.html";
    }
  });
}

initInterfaceScale();
