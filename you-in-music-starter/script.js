const form = document.querySelector("#song-form");
const steps = [...document.querySelectorAll(".form-step")];
const nextButton = document.querySelector("#next-button");
const backButton = document.querySelector("#back-button");
const submitButton = document.querySelector("#submit-button");
const progressBar = document.querySelector("#progress-bar");
const progressPercent = document.querySelector("#progress-percent");
const stepLabel = document.querySelector("#step-label");
const formMessage = document.querySelector("#form-message");
const reviewPanel = document.querySelector("#review-panel");
const formCard = document.querySelector(".form-card");
const STORAGE_KEY = "you-in-music-draft";
let currentStep = 0;

const menuButton = document.querySelector(".menu-button");
const siteNav = document.querySelector(".site-nav");
menuButton?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});
siteNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  siteNav.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
}));

document.querySelector("#year").textContent = new Date().getFullYear();

function formDataToObject() {
  const data = new FormData(form);
  const result = {};
  for (const [key, value] of data.entries()) {
    if (result[key]) {
      result[key] = Array.isArray(result[key]) ? [...result[key], value] : [result[key], value];
    } else {
      result[key] = value;
    }
  }
  return result;
}

function saveDraft() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formDataToObject()));
}

function loadDraft() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    Object.entries(draft).forEach(([key, value]) => {
      const fields = [...form.querySelectorAll(`[name="${CSS.escape(key)}"]`)];
      const values = Array.isArray(value) ? value : [value];
      fields.forEach((field) => {
        if (field.type === "checkbox" || field.type === "radio") {
          field.checked = values.includes(field.value);
        } else {
          field.value = value;
        }
      });
    });
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function validateStep() {
  const activeStep = steps[currentStep];
  const requiredFields = [...activeStep.querySelectorAll("[required]")];
  let valid = true;
  let firstInvalid = null;

  const radioGroups = new Set();
  requiredFields.forEach((field) => {
    if (field.type === "radio") {
      if (radioGroups.has(field.name)) return;
      radioGroups.add(field.name);
      const checked = activeStep.querySelector(`input[name="${CSS.escape(field.name)}"]:checked`);
      if (!checked) {
        valid = false;
        firstInvalid ||= field;
      }
      return;
    }
    if (!field.checkValidity()) {
      valid = false;
      firstInvalid ||= field;
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  });

  formMessage.textContent = valid ? "" : "Give this step one more look. A required piece is still hiding.";
  if (firstInvalid) firstInvalid.focus();
  return valid;
}

function updateReview() {
  const data = formDataToObject();
  const fields = [
    ["For", `${data.recipientName || ""} ${data.relationship ? `(${data.relationship})` : ""}`],
    ["Occasion", data.occasion],
    ["Emotional goal", Array.isArray(data.feelings) ? data.feelings.join(", ") : data.feelings],
    ["Story", data.story],
    ["Key memories", data.memories],
    ["Their personality", data.personality],
    ["Specific details", data.details],
    ["Exact phrases", data.phrases],
    ["Avoid", data.avoid || "Nothing listed"],
    ["Sound", [data.genre, data.vocal, data.energy].filter(Boolean).join(" · ")],
    ["References", data.references || "No references listed"]
  ];

  reviewPanel.innerHTML = fields
    .filter(([, value]) => value)
    .map(([label, value]) => `<div class="review-item"><strong>${escapeHtml(label)}</strong><p>${escapeHtml(String(value))}</p></div>`)
    .join("");
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);
}

function showStep(index, shouldScroll = true) {
  currentStep = index;
  steps.forEach((step, stepIndex) => step.classList.toggle("active", stepIndex === index));
  const percent = Math.round(((index + 1) / steps.length) * 100);
  progressBar.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
  stepLabel.textContent = `Step ${index + 1} of ${steps.length}`;
  backButton.disabled = index === 0;
  nextButton.classList.toggle("hidden", index === steps.length - 1);
  submitButton.classList.toggle("hidden", index !== steps.length - 1);
  formMessage.textContent = "";
  if (index === steps.length - 1) updateReview();
  if (shouldScroll) formCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

nextButton.addEventListener("click", () => {
  if (!validateStep()) return;
  saveDraft();
  showStep(Math.min(currentStep + 1, steps.length - 1));
});

backButton.addEventListener("click", () => {
  saveDraft();
  showStep(Math.max(currentStep - 1, 0));
});

form.addEventListener("input", saveDraft);
form.addEventListener("change", saveDraft);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateStep()) return;

  const data = formDataToObject();
  const payload = {
    submittedAt: new Date().toISOString(),
    project: "You In Music Song Request",
    ...data
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = (data.recipientName || "song-request").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  anchor.href = url;
  anchor.download = `${safeName || "song-request"}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  localStorage.setItem("you-in-music-last-submission", JSON.stringify(payload));
  localStorage.removeItem(STORAGE_KEY);
  const template = document.querySelector("#success-template");
  formCard.innerHTML = template.innerHTML;
  document.querySelector("#start-over-button")?.addEventListener("click", () => window.location.reload());
});

loadDraft();
showStep(0, false);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
