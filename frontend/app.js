const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const previewImg = document.getElementById("previewImg");
const previewMeta = document.getElementById("previewMeta");
const analyzeBtn = document.getElementById("analyzeBtn");
const progressBar = document.getElementById("progressBar");
const btnText = document.getElementById("btnText");
const statusEl = document.getElementById("status");

const probEl = document.getElementById("probability");
const confEl = document.getElementById("confidence");
const aiBadge = document.getElementById("badge");
const c2paBadge = document.getElementById("c2paBadge");
const c2paDataContainer = document.getElementById("c2paData");

let selectedFile = null;

// UI Helpers
function setStatus(msg, color = "") {
  statusEl.textContent = msg;
  statusEl.style.color = color || "var(--muted)";
}

function updateProgress(val) {
  progressBar.style.width = `${val}%`;
}

// Handle File Selection
fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));
dropzone.addEventListener("click", () => fileInput.click());

function handleFile(file) {
  if (!file) return;
  selectedFile = file;
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  previewImg.style.display = "block";
  previewMeta.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  analyzeBtn.disabled = false;
  document.getElementById("resetBtn").disabled = false;
  setStatus("Image ready for verification.");
}

// Reset
document.getElementById("resetBtn").addEventListener("click", () => {
  location.reload(); // Simplest way to clear all states
});

// Analysis Logic
analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  analyzeBtn.disabled = true;
  btnText.textContent = "Verifying...";
  updateProgress(10);
  setStatus("Uploading and scanning for C2PA manifests...");

  const formData = new FormData();
  formData.append("image", selectedFile);

  // Fake some progress movement
  let p = 10;
  const timer = setInterval(() => {
    if (p < 80) { p += 5; updateProgress(p); }
  }, 400);

  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Server Error");
    const data = await response.json();

    clearInterval(timer);
    updateProgress(100);
    
    // 1. Update AI Results
    renderAIResults(data);

    // 2. Update C2PA Results (Assuming your Python backend returns a 'c2pa' object)
    renderC2PAResults(data.c2pa);

    setStatus("Analysis Complete", "var(--good)");
    btnText.textContent = "Analyze & Verify";
    analyzeBtn.disabled = false;

  } catch (err) {
    clearInterval(timer);
    updateProgress(0);
    setStatus("Error: " + err.message, "var(--bad)");
    btnText.textContent = "Retry";
    analyzeBtn.disabled = false;
  }
});

function renderAIResults(data) {
  const prob = data.probability || 0;
  probEl.textContent = prob.toFixed(3);
  probEl.classList.remove("muted");
  
  confEl.textContent = (data.confidence || 0).toFixed(1) + "%";
  confEl.classList.remove("muted");

  if (data.prediction === "AI") {
    aiBadge.textContent = "Likely AI";
    aiBadge.className = "badge badge--ai";
  } else {
    aiBadge.textContent = "Likely Human";
    aiBadge.className = "badge badge--real";
  }
}

function renderC2PAResults(c2pa) {
  c2paDataContainer.innerHTML = "";
  
  if (!c2pa || !c2pa.active_manifest) {
    c2paBadge.textContent = "No Manifest Found";
    c2paBadge.className = "badge badge--neutral";
    c2paDataContainer.innerHTML = `<p class="muted" style="font-size:0.8rem">This image does not contain C2PA provenance data. It may have been stripped or never signed.</p>`;
    return;
  }

  // If found
  c2paBadge.textContent = "Signed & Verified";
  c2paBadge.className = "badge badge--real";

  const info = [
    { label: "Producer", value: c2pa.active_manifest.producer || "Unknown" },
    { label: "Tool Used", value: c2pa.active_manifest.claim_generator || "Unknown" },
    { label: "Created", value: new Date(c2pa.active_manifest.signature_info.time).toLocaleDateString() },
    { label: "Validation", value: "Valid Signature" }
  ];

  info.forEach(item => {
    const div = document.createElement("div");
    div.className = "prov-item";
    div.innerHTML = `<span>${item.label}</span><span>${item.value}</span>`;
    c2paDataContainer.appendChild(div);
  });
}
