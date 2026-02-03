const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const previewImg = document.getElementById("previewImg");
const previewMeta = document.getElementById("previewMeta");

const analyzeBtn = document.getElementById("analyzeBtn");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");
const btnText = document.getElementById("btnText");
const spinner = document.getElementById("spinner");

const badge = document.getElementById("badge");
const predictionEl = document.getElementById("prediction");
const confidenceEl = document.getElementById("confidence");
const probabilityEl = document.getElementById("probability");
const notesEl = document.getElementById("notes");

let selectedFile = null;

function setStatus(msg, kind = "info") {
  statusEl.textContent = msg || "";
  statusEl.style.color =
    kind === "error" ? "rgba(251,113,133,0.9)" :
    kind === "ok" ? "rgba(45,212,191,0.9)" :
    "rgba(255,255,255,0.68)";
}

function setResultEmpty() {
  badge.className = "badge badge--neutral";
  badge.textContent = "No result";
  predictionEl.textContent = "—";
  confidenceEl.textContent = "—";
  probabilityEl.textContent = "—";
  notesEl.textContent = "Upload an image and click Analyze.";

  [predictionEl, confidenceEl, probabilityEl, notesEl].forEach(el => el.classList.add("muted"));
}

function setResult(data) {
  const pred = data?.prediction ?? "—";
  const conf = data?.confidence ?? null;
  const pAi  = data?.probability ?? null;   

  predictionEl.textContent = pred;
  confidenceEl.textContent = (typeof conf === "number") ? `${conf.toFixed(1)}%` : "—";
  probabilityEl.textContent = (typeof pAi === "number") ? pAi.toFixed(4) : "—";

  [predictionEl, confidenceEl, probabilityEl, notesEl].forEach(el => el.classList.remove("muted"));

  const predLower = String(pred).toLowerCase();
  if (predLower.includes("ai")) {
    badge.className = "badge badge--ai";
    badge.textContent = "Likely AI";
    notesEl.textContent = "Model score suggests this image is AI-generated or heavily altered.";
  } else if (predLower.includes("real")) {
    badge.className = "badge badge--real";
    badge.textContent = "Likely Real";
    notesEl.textContent = "Model score suggests this image looks like a real photo (not guaranteed).";
  } else {
    badge.className = "badge badge--neutral";
    badge.textContent = "Result";
    notesEl.textContent = "Received a result, but the prediction label was unexpected.";
  }
}

function showPreview(file) {
  previewImg.style.display = "none";
  previewMeta.textContent = "";
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  previewImg.onload = () => URL.revokeObjectURL(url);
  previewImg.style.display = "block";
  previewMeta.textContent = `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;
}

function onFileSelected(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file (PNG/JPG/WEBP).", "error");
    return;
  }
  selectedFile = file;
  showPreview(file);
  analyzeBtn.disabled = false;
  resetBtn.disabled = false;
  setStatus("Ready to analyze.", "ok");
  setResultEmpty();
}

dropzone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => onFileSelected(e.target.files?.[0]));

dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("is-dragover"); });
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("is-dragover");
  onFileSelected(e.dataTransfer.files?.[0]);
});

resetBtn.addEventListener("click", () => {
  selectedFile = null;
  fileInput.value = "";
  previewImg.removeAttribute("src");
  previewImg.style.display = "none";
  previewMeta.textContent = "";
  analyzeBtn.disabled = true;
  resetBtn.disabled = true;
  setStatus("");
  setResultEmpty();
});

analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  // Set Loading UI
  analyzeBtn.disabled = true;
  btnText.textContent = "Analyzing...";
  spinner.style.display = "block";
  setStatus("Analyzing…", "info");

  try {
    const form = new FormData();
    form.append("image", selectedFile);

    const res = await fetch("/api/predict", {
      method: "POST",
      body: form
    });

    if (!res.ok) throw new Error(`Server error (${res.status})`);

    const data = await res.json();
    setResult(data);
    setStatus("Done.", "ok");
  } catch (err) {
    console.error(err);
    setStatus(err?.message || "Something went wrong.", "error");
  } finally {
    // Reset Loading UI
    analyzeBtn.disabled = false;
    btnText.textContent = "Analyze";
    spinner.style.display = "none";
  }
});

setResultEmpty();
