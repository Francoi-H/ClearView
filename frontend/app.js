const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const previewImg = document.getElementById("previewImg");
const previewMeta = document.getElementById("previewMeta");

const analyzeBtn = document.getElementById("analyzeBtn");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");
const spinner = document.getElementById("spinner");

const badge = document.getElementById("badge");
const predictionEl = document.getElementById("prediction");
const confidenceEl = document.getElementById("confidence");
const probabilityEl = document.getElementById("probability");
const notesEl = document.getElementById("notes");

let selectedFile = null;

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function setResultEmpty() {
  badge.className = "badge badge--neutral";
  badge.textContent = "No result";
  predictionEl.textContent = "—";
  confidenceEl.textContent = "—";
  probabilityEl.textContent = "—";
  notesEl.textContent = "Upload an image and click Analyze.";
}

function setResult(data) {
  predictionEl.textContent = data.prediction;
  confidenceEl.textContent = `${data.confidence.toFixed(1)}%`;
  probabilityEl.textContent = data.probability.toFixed(4);

  if (data.prediction.toLowerCase().includes("ai")) {
    badge.className = "badge badge--ai";
    badge.textContent = "Likely AI";
    notesEl.textContent = "Model indicates the image is likely AI-generated.";
  } else {
    badge.className = "badge badge--real";
    badge.textContent = "Likely Real";
    notesEl.textContent = "Model indicates the image is likely real.";
  }
}

function showPreview(file) {
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  previewImg.style.display = "block";
  previewMeta.textContent = `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;
}

dropzone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  showPreview(file);
  analyzeBtn.disabled = false;
  resetBtn.disabled = false;
  setResultEmpty();
});

resetBtn.addEventListener("click", () => {
  selectedFile = null;
  fileInput.value = "";
  previewImg.style.display = "none";
  previewMeta.textContent = "";
  analyzeBtn.disabled = true;
  resetBtn.disabled = true;
  setStatus("");
  setResultEmpty();
});

analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  analyzeBtn.disabled = true;
  spinner.classList.remove("hidden");
  setStatus("Analyzing…");

  try {
    const form = new FormData();
    form.append("image", selectedFile);

    const res = await fetch("/api/predict", {
      method: "POST",
      body: form
    });

    const data = await res.json();
    setResult(data);
    setStatus("Done.");
  } catch (err) {
    setStatus("Error analyzing image.");
  } finally {
    spinner.classList.add("hidden");
    analyzeBtn.disabled = false;
  }
});

setResultEmpty();
