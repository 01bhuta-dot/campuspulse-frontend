import { recordService } from "./data.js";

const VALID_STATUSES = ["Pending", "In progress", "Completed"];

// DOM Elements
const form = document.getElementById("record-form");
const formHeading = document.getElementById("form-heading");
const recordIdInput = document.getElementById("record-id");
const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const statusInput = document.getElementById("status");
const descriptionInput = document.getElementById("description");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const resultsCount = document.getElementById("results-count");
const feedbackBanner = document.getElementById("feedback-banner");
const emptyState = document.getElementById("empty-state");
const recordsContainer = document.getElementById("records-container");

// Stats Elements
const statTotal = document.getElementById("stat-total");
const statPending = document.getElementById("stat-pending");
const statProgress = document.getElementById("stat-progress");
const statCompleted = document.getElementById("stat-completed");

// Modal Elements
const viewModal = document.getElementById("view-modal");
const modalId = document.getElementById("modal-id");
const modalTitle = document.getElementById("modal-title");
const modalCategory = document.getElementById("modal-category");
const modalStatus = document.getElementById("modal-status");
const modalDescription = document.getElementById("modal-description");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalDoneBtn = document.getElementById("modal-done-btn");

let feedbackTimer = null;

function showFeedback(message, type = "success") {
  clearTimeout(feedbackTimer);
  feedbackBanner.textContent = message;
  feedbackBanner.className = `feedback ${type}`;
  feedbackTimer = setTimeout(() => {
    feedbackBanner.classList.add("hidden");
  }, 4500);
}

function validateRecordInput(raw) {
  const title = raw.title.trim();
  const category = raw.category.trim();
  const description = raw.description.trim();
  const status = raw.status.trim();

  if (title.length < 3 || title.length > 80) {
    return { valid: false, error: "Title must be between 3 and 80 characters (excluding leading/trailing spaces)." };
  }
  if (category.length < 2 || category.length > 40) {
    return { valid: false, error: "Category must be between 2 and 40 characters." };
  }
  if (description.length < 5 || description.length > 300) {
    return { valid: false, error: "Description must be between 5 and 300 characters." };
  }
  if (!VALID_STATUSES.includes(status)) {
    return { valid: false, error: "Status must be Pending, In progress, or Completed." };
  }

  return {
    valid: true,
    data: { title, category, description, status }
  };
}

function getStatusClass(status) {
  if (status === "Pending") return "status-pending";
  if (status === "In progress") return "status-progress";
  return "status-completed";
}

function updateStats(allRecords) {
  statTotal.textContent = allRecords.length;
  statPending.textContent = allRecords.filter((r) => r.status === "Pending").length;
  statProgress.textContent = allRecords.filter((r) => r.status === "In progress").length;
  statCompleted.textContent = allRecords.filter((r) => r.status === "Completed").length;
}

function resetFormToCreateMode() {
  form.reset();
  recordIdInput.value = "";
  formHeading.textContent = "Log New Support Request";
  submitBtn.textContent = "Submit Ticket";
  cancelEditBtn.classList.add("hidden");
}

function enterEditMode(record) {
  recordIdInput.value = String(record.id);
  titleInput.value = record.title;
  categoryInput.value = record.category;
  statusInput.value = record.status;
  descriptionInput.value = record.description;

  formHeading.textContent = `Editing Ticket #${record.id}`;
  submitBtn.textContent = "Update Ticket";
  cancelEditBtn.classList.remove("hidden");

  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  titleInput.focus();
}

function openDetailsModal(record) {
  modalId.textContent = `#${record.id}`;
  modalTitle.textContent = record.title;
  modalCategory.textContent = record.category;
  modalStatus.textContent = record.status;
  modalStatus.className = `status-badge ${getStatusClass(record.status)}`;
  modalDescription.textContent = record.description;

  if (typeof viewModal.showModal === "function") {
    viewModal.showModal();
  }
}

function buildRecordCard(record) {
  const card = document.createElement("article");
  card.className = "record-card";

  // Top Row: ID + Status Badge
  const topRow = document.createElement("div");
  topRow.className = "card-top";

  const idBadge = document.createElement("span");
  idBadge.className = "ticket-id-badge";
  idBadge.textContent = `#${record.id}`;

  const statusBadge = document.createElement("span");
  statusBadge.className = `status-badge ${getStatusClass(record.status)}`;
  statusBadge.textContent = record.status;

  topRow.append(idBadge, statusBadge);

  // Body: Title, Category, Description
  const bodyDiv = document.createElement("div");

  const titleEl = document.createElement("h3");
  titleEl.className = "card-title";
  titleEl.textContent = record.title;

  const catEl = document.createElement("span");
  catEl.className = "category-chip";
  catEl.textContent = record.category;

  const descEl = document.createElement("p");
  descEl.className = "card-desc";
  descEl.textContent = record.description;

  bodyDiv.append(titleEl, catEl, descEl);

  // Action Buttons: View, Edit, Delete
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "card-actions";

  const viewBtn = document.createElement("button");
  viewBtn.type = "button";
  viewBtn.className = "btn-sm btn-view";
  viewBtn.textContent = "View";
  viewBtn.setAttribute("aria-label", `View ticket #${record.id}: ${record.title}`);
  viewBtn.addEventListener("click", async () => {
    try {
      const freshRecord = await recordService.get(record.id);
      openDetailsModal(freshRecord);
    } catch (err) {
      showFeedback(err.message, "error");
    }
  });

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn-sm btn-edit";
  editBtn.textContent = "Edit";
  editBtn.setAttribute("aria-label", `Edit ticket #${record.id}: ${record.title}`);
  editBtn.addEventListener("click", async () => {
    try {
      const freshRecord = await recordService.get(record.id);
      enterEditMode(freshRecord);
    } catch (err) {
      showFeedback(err.message, "error");
    }
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn-sm btn-delete";
  deleteBtn.textContent = "Delete";
  deleteBtn.setAttribute("aria-label", `Delete ticket #${record.id}: ${record.title}`);
  deleteBtn.addEventListener("click", async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Ticket #${record.id} ("${record.title}")? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const result = await recordService.remove(record.id);
      if (Number(recordIdInput.value) === record.id) {
        resetFormToCreateMode();
      }
      showFeedback(result.message, "success");
      await renderRecords();
    } catch (err) {
      showFeedback(err.message, "error");
    }
  });

  actionsDiv.append(viewBtn, editBtn, deleteBtn);
  card.append(topRow, bodyDiv, actionsDiv);
  return card;
}

async function renderRecords() {
  const allRecords = await recordService.list();
  updateStats(allRecords);

  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filtered = allRecords.filter((item) => {
    const matchesTitle = item.title.toLowerCase().includes(query);
    const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;
    return matchesTitle && matchesStatus;
  });

  // Sort newest first so newly created tickets appear immediately at the top
  filtered.sort((a, b) => b.id - a.id);

  resultsCount.textContent = `Showing ${filtered.length} of ${allRecords.length} record${allRecords.length === 1 ? "" : "s"}`;
  recordsContainer.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
    const fragment = document.createDocumentFragment();
    filtered.forEach((record) => {
      fragment.appendChild(buildRecordCard(record));
    });
    recordsContainer.appendChild(fragment);
  }
}

// Form Submit (Create or Update)
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const validation = validateRecordInput({
    title: titleInput.value,
    category: categoryInput.value,
    status: statusInput.value,
    description: descriptionInput.value
  });

  if (!validation.valid) {
    showFeedback(validation.error, "error");
    return;
  }

  const editingId = recordIdInput.value;

  try {
    if (editingId) {
      const updated = await recordService.update(editingId, validation.data);
      showFeedback(`Ticket #${updated.id} updated successfully.`, "success");
    } else {
      const created = await recordService.create(validation.data);
      showFeedback(`New support ticket #${created.id} created.`, "success");
    }

    resetFormToCreateMode();
    await renderRecords();
  } catch (err) {
    showFeedback(err.message, "error");
  }
});

cancelEditBtn.addEventListener("click", () => {
  resetFormToCreateMode();
  showFeedback("Edit cancelled.", "success");
});

searchInput.addEventListener("input", renderRecords);
statusFilter.addEventListener("change", renderRecords);

closeModalBtn.addEventListener("click", () => viewModal.close());
modalDoneBtn.addEventListener("click", () => viewModal.close());
viewModal.addEventListener("click", (e) => {
  if (e.target === viewModal) viewModal.close();
});

// Larger Bubbly Light-Violet Raindrop Effect
function initRaindrops() {
  const canvas = document.getElementById("raindrop-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  let width = 0;
  let height = 0;
  let drops = [];
  let ripples = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createDrop(randomY = false) {
    // Larger radius (14px to 32px) so each drop is clearly visible
    const radius = 14 + Math.random() * 18;
    return {
      x: Math.random() * width,
      y: randomY ? Math.random() * height : -45 - Math.random() * 140,
      r: radius,
      vy: 0.9 + Math.random() * 1.5,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.014 + Math.random() * 0.018,
      alpha: 0.65 + Math.random() * 0.25
    };
  }

  function seedDrops() {
    const count = Math.min(34, Math.max(16, Math.floor(width / 52)));
    drops = Array.from({ length: count }, () => createDrop(true));
  }

  function drawGlossyDrop(drop) {
    const { x, y, r, alpha } = drop;
    const dropHeight = r * 1.32;

    ctx.save();
    ctx.translate(x, y);

    // Teardrop silhouette
    ctx.beginPath();
    ctx.moveTo(0, -dropHeight);
    ctx.bezierCurveTo(r * 1.18, -r * 0.15, r * 1.08, r * 1.08, 0, r * 1.08);
    ctx.bezierCurveTo(-r * 1.08, r * 1.08, -r * 1.18, -r * 0.15, 0, -dropHeight);
    ctx.closePath();

    // Rich light-violet refraction gradient
    const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.25, r * 0.1, 0, r * 0.25, r * 1.4);
    bodyGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.85})`);
    bodyGrad.addColorStop(0.5, `rgba(196, 181, 253, ${alpha * 0.55})`);
    bodyGrad.addColorStop(1, `rgba(124, 58, 237, ${alpha * 0.45})`);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.lineWidth = 1.6;
    ctx.strokeStyle = `rgba(109, 40, 217, ${alpha * 0.72})`;
    ctx.stroke();

    // Bright specular bubble highlight
    ctx.beginPath();
    ctx.ellipse(-r * 0.36, -r * 0.12, r * 0.24, r * 0.4, -0.45, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 1.2)})`;
    ctx.fill();

    // Secondary smaller bubble gleam
    ctx.beginPath();
    ctx.arc(r * 0.28, r * 0.55, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
    ctx.fill();

    ctx.restore();
  }

  function drawRipples() {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.radius += 0.9;
      rp.alpha -= 0.014;
      if (rp.alpha <= 0) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.radius, rp.radius * 0.42, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(109, 40, 217, ${rp.alpha * 0.7})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    drawRipples();

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.y += d.vy;
      d.swayPhase += d.swaySpeed;
      d.x += Math.sin(d.swayPhase) * 0.4;

      drawGlossyDrop(d);

      if (d.y - d.r > height) {
        ripples.push({ x: d.x, y: height - 14, radius: d.r * 0.55, alpha: 0.75 });
        drops[i] = createDrop(false);
      }
    }

    requestAnimationFrame(tick);
  }

  resize();
  seedDrops();
  window.addEventListener("resize", () => {
    resize();
    seedDrops();
  });
  requestAnimationFrame(tick);
}

// Initial load
initRaindrops();
renderRecords();