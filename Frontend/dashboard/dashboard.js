const API_URL = "https://job-backend-production-734e.up.railway.app";

let currentUser;
try {
  currentUser = JSON.parse(localStorage.getItem("jobTrackerUser") || "null");
} catch {
  currentUser = null;
}
const authToken = localStorage.getItem("jobTrackerToken") || "";
if (!currentUser?.id) {
  window.location.replace("../login.html");
}

let jobs = [];
let reminderHistory = [];
let editIndex = null;

function apiHeaders(json = true) {
  const h = {};
  if (authToken) {
    h.Authorization = `Bearer ${authToken}`;
  }
  if (json) h["Content-Type"] = "application/json";
  return h;
}

function fetchWithAuth(url, options = {}) {
  return fetch(API_URL + url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });
}

function logout() {
  fetchWithAuth("/logout", { method: "POST" }).finally(() => {
    localStorage.removeItem("jobTrackerUser");
    localStorage.removeItem("jobTrackerToken");
    window.location.replace("../login.html");
  });
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

function showToast(message, success = true) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${success ? "success" : "error"}`;
  toast.style.opacity = "1";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.style.opacity = "0";
  }, 3000);
}

function reminderEmailKey() {
  return `reminderEmail_${currentUser.id}`;
}

function getReminderEmail() {
  return document.getElementById("reminderEmail")?.value.trim() || "";
}

function saveReminderEmail() {
  const email = getReminderEmail();
  localStorage.setItem(reminderEmailKey(), email);
}

function loadReminderEmail() {
  const email = localStorage.getItem(reminderEmailKey()) || "";
  const input = document.getElementById("reminderEmail");
  if (input) input.value = email;
}

async function loadJobsFromServer() {
  try {
    const res = await fetchWithAuth("/api/jobs", { headers: apiHeaders(false) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.message || "Could not load jobs", false);
      jobs = [];
      renderJobs();
      return;
    }
    const data = await res.json();
    jobs = Array.isArray(data.jobs) ? data.jobs : [];
    renderJobs();
    drawStatusViz3d();
  } catch (e) {
    showToast("Network error loading jobs.", false);
    jobs = [];
    renderJobs();
  }
}

async function fetchReminderHistory() {
  try {
    const res = await fetchWithAuth("/api/reminders", { headers: apiHeaders(false) });
    if (!res.ok) return;
    const data = await res.json();
    reminderHistory = Array.isArray(data.reminders) ? data.reminders : [];
    renderReminderHistory();
  } catch {
    renderReminderHistory();
  }
}

function renderReminderHistory() {
  const container = document.getElementById("reminderHistory");
  if (!container) return;
  container.innerHTML = "";

  if (reminderHistory.length === 0) {
    container.innerHTML = "<p>No reminders sent yet.</p>";
    return;
  }

  reminderHistory.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "history-entry";
    div.innerHTML = `
      <div><strong>${escapeHtml(entry.company)}</strong> - ${escapeHtml(entry.role)}</div>
      <div>Email: ${escapeHtml(entry.email)}</div>
      <div>Date: ${escapeHtml(entry.sentAt)}</div>
      <div>Status: <span class="status">${escapeHtml(entry.status)}</span></div>
      ${entry.previewUrl ? `<div><a href="${escapeHtml(entry.previewUrl)}" target="_blank" rel="noopener">Preview email</a></div>` : ""}
      ${entry.error ? `<div class="history-error">${escapeHtml(entry.error)}</div>` : ""}
    `;
    container.appendChild(div);
  });
}

function escapeHtml(s) {
  if (s == null) return "";
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function safeExternalUrl(u) {
  if (!u || typeof u !== "string") return null;
  try {
    const x = new URL(u);
    if (x.protocol === "https:" || x.protocol === "http:") return u;
  } catch {
    return null;
  }
  return null;
}

function persistUserCareerProfile(cp) {
  currentUser = { ...currentUser, careerProfile: cp };
  localStorage.setItem("jobTrackerUser", JSON.stringify(currentUser));
}

async function populateCareerFieldSelect() {
  const sel = document.getElementById("profileField");
  if (!sel) return;
  try {
    const res = await fetchWithAuth("/api/career-fields");
    const data = await res.json();
    sel.innerHTML = "";
    (data.fields || []).forEach((f) => {
      const o = document.createElement("option");
      o.value = f.id;
      o.textContent = f.label;
      sel.appendChild(o);
    });
  } catch {
    sel.innerHTML = '<option value="other">General / Other</option>';
  }
}

async function loadCareerProfileForm() {
  try {
    const res = await fetchWithAuth("/api/me/career-profile", { headers: apiHeaders(false) });
    if (!res.ok) return;
    const data = await res.json();
    const p = data.careerProfile || {};
    persistUserCareerProfile(p);

    const field = document.getElementById("profileField");
    if (field && p.field) field.value = p.field;
    const loc = document.getElementById("profileLocation");
    if (loc) loc.value = p.location || "";
    const rem = document.getElementById("profileRemote");
    if (rem && p.remotePreference) rem.value = p.remotePreference;
    const sen = document.getElementById("profileSeniority");
    if (sen && p.seniority) sen.value = p.seniority;
    const tt = document.getElementById("profileTargetTitles");
    if (tt) tt.value = Array.isArray(p.targetTitles) ? p.targetTitles.join("\n") : "";
    const sk = document.getElementById("profileSkills");
    if (sk) sk.value = Array.isArray(p.skills) ? p.skills.join(", ") : "";
  } catch {
    /* ignore */
  }
}

async function saveCareerProfile() {
  const body = {
    field: document.getElementById("profileField")?.value || "other",
    targetTitles: (document.getElementById("profileTargetTitles")?.value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    location: document.getElementById("profileLocation")?.value.trim() || "",
    remotePreference: document.getElementById("profileRemote")?.value || "any",
    seniority: document.getElementById("profileSeniority")?.value || "any",
    skills: (document.getElementById("profileSkills")?.value || "")
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  };

  try {
    const res = await fetchWithAuth("/api/me/career-profile", {
      method: "PUT",
      headers: apiHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || data.error || "Could not save profile", false);
      return;
    }
    persistUserCareerProfile(data.careerProfile);
    showToast("Career profile saved.");
    await loadSuggestions();
  } catch {
    showToast("Network error saving profile.", false);
  }
}

function prefillFromSuggestion(s) {
  let company = (s.company || "").trim();
  if (company.startsWith("—")) company = "";
  openFormForNew();
  document.getElementById("company").value = company;
  document.getElementById("role").value = (s.title || "").trim().slice(0, 200);
  showToast("Prefilled — set application date and save.", true);
}

async function loadSuggestions() {
  const list = document.getElementById("suggestionList");
  const metaEl = document.getElementById("suggestionMeta");
  const hintEl = document.getElementById("suggestionHint");
  if (!list) return;

  list.innerHTML = "<p>Loading suggestions…</p>";
  try {
    const res = await fetchWithAuth("/api/suggestions", { headers: apiHeaders(false) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      list.innerHTML = `<p>${escapeHtml(data.message || data.error || "Could not load suggestions")}</p>`;
      return;
    }

    const m = data.meta || {};
    if (metaEl) {
      const parts = [
        m.fieldLabel || "",
        m.searchUsed ? `Search: “${m.searchUsed}”` : "",
        m.adzunaEnabled ? "Live listings on." : "Rule-based + boards (add Adzuna keys for live jobs).",
      ];
      metaEl.textContent = parts.filter(Boolean).join(" · ");
    }
    if (hintEl) {
      if (m.hint || m.adzunaError) {
        hintEl.hidden = false;
        hintEl.textContent = m.adzunaError ? `Listing API: ${m.adzunaError}` : m.hint;
      } else {
        hintEl.hidden = true;
        hintEl.textContent = "";
      }
    }

    const items = data.suggestions || [];
    list.innerHTML = "";
    if (items.length === 0) {
      list.innerHTML = "<p>Set your field and targets above, or add applications — then refresh.</p>";
      return;
    }

    items.forEach((s) => {
      const div = document.createElement("div");
      div.className = "suggestion-card";
      const loc = s.location ? `<p class="sub">${escapeHtml(s.location)}</p>` : "";
      const ext = safeExternalUrl(s.url);
      const linkHtml = ext
        ? `<a class="secondary-btn" href="${escapeHtml(ext)}" target="_blank" rel="noopener noreferrer">Open link</a>`
        : "";

      div.innerHTML = `
        <span class="source-badge ${s.source === "adzuna" ? "adzuna" : ""} ${s.source === "position" ? "position" : ""}">${escapeHtml(s.source || "tip")}</span>
        <h3>${escapeHtml(s.title)}</h3>
        <p class="sub"><strong>${escapeHtml(s.company)}</strong></p>
        ${loc}
        <p class="reason">${escapeHtml(s.reason)}</p>
        <div class="suggestion-actions"></div>
      `;
      const actions = div.querySelector(".suggestion-actions");
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "secondary-btn";
      addBtn.textContent = "Add to tracker";
      addBtn.addEventListener("click", () => prefillFromSuggestion(s));
      actions.appendChild(addBtn);
      if (linkHtml) {
        const wrap = document.createElement("span");
        wrap.innerHTML = linkHtml;
        const a = wrap.querySelector("a");
        if (a) actions.appendChild(a);
      }
      list.appendChild(div);
    });
  } catch {
    list.innerHTML = "<p>Network error loading suggestions.</p>";
  }
}

let modalSuggestTimer = null;
let modalSuggestSeq = 0;

function scheduleModalPositionSuggestions() {
  clearTimeout(modalSuggestTimer);
  modalSuggestTimer = setTimeout(() => fetchModalPositionSuggestions(), 450);
}

async function fetchModalPositionSuggestions() {
  const mySeq = ++modalSuggestSeq;
  const modal = document.getElementById("modal");
  const box = document.getElementById("modalPositionSuggestions");
  const metaEl = document.getElementById("modalPositionSuggestMeta");
  if (!modal || !box) return;
  if (modal.style.display !== "flex") return;

  const currentPosition = document.getElementById("currentPosition")?.value.trim() || "";
  const applyingRole = document.getElementById("role")?.value.trim() || "";

  if (currentPosition.length < 2 && applyingRole.length < 2) {
    box.innerHTML =
      '<p class="modal-suggest-hint">Type your <strong>current job title</strong> above (or the <strong>role</strong> you are applying for) to see related ideas.</p>';
    if (metaEl) metaEl.textContent = "";
    return;
  }

  box.innerHTML = '<p class="modal-suggest-loading">Looking up related roles…</p>';
  if (metaEl) metaEl.textContent = "";

  try {
    const q = new URLSearchParams();
    if (currentPosition) q.set("currentPosition", currentPosition);
    if (applyingRole) q.set("applyingRole", applyingRole);
    const res = await fetchWithAuth(`/api/suggestions/for-position?${q}`, { headers: apiHeaders(false) });
    const data = await res.json().catch(() => ({}));

    if (mySeq !== modalSuggestSeq) return;

    if (!res.ok) {
      box.innerHTML = `<p class="modal-suggest-hint">${escapeHtml(data.message || data.error || "Could not load")}</p>`;
      return;
    }

    const m = data.meta || {};
    if (metaEl) {
      const anchorLabel = m.usedCurrentPosition
        ? `Anchored on your current position: “${m.anchorUsed || ""}”`
        : `Anchored on role you’re applying for: “${m.anchorUsed || ""}”`;
      const extra = m.fieldLabel ? ` · ${m.fieldLabel}` : "";
      metaEl.textContent = `${anchorLabel}${extra}`;
    }

    const items = data.suggestions || [];
    box.innerHTML = "";
    if (!items.length) {
      box.innerHTML =
        '<p class="modal-suggest-hint">No suggestions yet — try a slightly longer or more common job title.</p>';
      return;
    }

    items.slice(0, 8).forEach((s) => {
      const row = document.createElement("div");
      row.className = "modal-suggest-item";
      const loc = s.location ? ` · ${escapeHtml(s.location)}` : "";
      const ext = safeExternalUrl(s.url);
      const badgeClass =
        s.source === "adzuna" ? "badge adzuna" : s.source === "position" ? "badge position" : "badge";
      row.innerHTML = `
        <div><span class="${badgeClass}">${escapeHtml(s.source || "tip")}</span> <strong>${escapeHtml(s.title)}</strong></div>
        <div class="mt">${escapeHtml(s.company)}${loc}</div>
        <div class="mt">${escapeHtml(s.reason)}</div>
        <div class="row"></div>
      `;
      const rowActions = row.querySelector(".row");
      const useBtn = document.createElement("button");
      useBtn.type = "button";
      useBtn.className = "secondary-btn";
      useBtn.style.fontSize = "0.75rem";
      useBtn.style.padding = "6px 10px";
      useBtn.textContent = "Use as applying role";
      useBtn.addEventListener("click", () => {
        const ri = document.getElementById("role");
        if (ri) ri.value = String(s.title || "").trim().slice(0, 200);
        scheduleModalPositionSuggestions();
      });
      rowActions.appendChild(useBtn);
      if (ext) {
        const a = document.createElement("a");
        a.href = ext;
        a.textContent = "Open link";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "secondary-btn";
        a.style.fontSize = "0.75rem";
        a.style.padding = "6px 10px";
        rowActions.appendChild(a);
      }
      box.appendChild(row);
    });
  } catch {
    if (mySeq !== modalSuggestSeq) return;
    box.innerHTML = '<p class="modal-suggest-hint">Network error.</p>';
  }
}

async function sendReminder(index) {
  const job = jobs[index];
  if (!job) return;

  let email = getReminderEmail();

  if (!email) {
    const entered = prompt("Enter the reminder email address before sending:");
    if (!entered || !entered.trim()) {
      showToast("Please provide a reminder email before sending.", false);
      return;
    }
    const input = document.getElementById("reminderEmail");
    if (input) input.value = entered.trim();
    saveReminderEmail();
    email = entered.trim();
    showToast("Reminder email saved.");
  }

  try {
    const res = await fetchWithAuth("/send-reminder", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        email,
        company: job.company,
        role: job.role,
        followUpDate: job.followUpDate,
        notes: job.notes,
      }),
    });

    const data = await res.json().catch(() => ({}));

    await fetchReminderHistory();

    if (!res.ok) {
      throw new Error(data.message || data.error || "Failed to send reminder.");
    }

    showToast(`Reminder sent successfully.${data.previewUrl ? " Preview available." : ""}`);
  } catch (err) {
    await fetchReminderHistory();
    showToast(`Could not send reminder: ${err.message}`, false);
  }
}

function updateAnalytics() {
  const total = jobs.length;
  const interviewCount = jobs.filter((job) => job.status === "Interview").length;
  const offerCount = jobs.filter((job) => job.status === "Offer").length;
  const ratio = total ? Math.round((interviewCount / total) * 100) : 0;

  const totalEl = document.getElementById("totalJobs");
  const ratioEl = document.getElementById("interviewRatio");
  const offerEl = document.getElementById("offerCount");
  if (totalEl) totalEl.innerText = total;
  if (ratioEl) ratioEl.innerText = `${ratio}%`;
  if (offerEl) offerEl.innerText = offerCount;
}

function renderNotifications() {
  const notificationList = document.getElementById("notificationList");
  if (!notificationList) return;
  notificationList.innerHTML = "";
  const upcoming = jobs.filter((job) => {
    if (!job.followUpDate) return false;
    const followUp = new Date(job.followUpDate);
    const now = new Date();
    const diff = (followUp - now) / (1000 * 60 * 60 * 24);
    return diff <= 7 && diff >= -1;
  });

  if (upcoming.length === 0) {
    notificationList.innerHTML = "<p>No upcoming follow-ups. Add a reminder to stay on top of your pipeline.</p>";
    return;
  }

  upcoming.forEach((job) => {
    const div = document.createElement("div");
    div.className = "notification";
    div.innerHTML = `
      <div>
        <strong>Follow up with ${escapeHtml(job.company)}</strong>
        <span>${formatDate(job.followUpDate)}</span>
      </div>
      <span class="notification-badge">Reminder</span>
    `;
    notificationList.appendChild(div);
  });
}

async function uploadResumeFile() {
  const resumeInput = document.getElementById("resume");
  if (!resumeInput.files || resumeInput.files.length === 0) {
    return null;
  }

  const formData = new FormData();
  formData.append("resume", resumeInput.files[0]);

  try {
    const res = await fetchWithAuth("/upload-resume", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    return await res.json();
  } catch {
    showToast("Resume upload failed. Please try again.", false);
    return null;
  }
}

async function saveJob() {
  const company = document.getElementById("company").value.trim();
  const role = document.getElementById("role").value.trim();
  const status = document.getElementById("status").value;
  const date = document.getElementById("date").value;
  const followUpDate = document.getElementById("followUp").value;
  const notes = document.getElementById("notes").value.trim();
  const currentPosition = document.getElementById("currentPosition")?.value.trim().slice(0, 120) || "";

  if (!company || !role || !date) {
    showToast("Company, role, and date are required.", false);
    return;
  }

  let resumeData = null;
  if (document.getElementById("resume").files.length > 0) {
    resumeData = await uploadResumeFile();
    if (!resumeData) return;
  }

  const existingJob = editIndex !== null ? jobs[editIndex] : null;
  const payload = {
    company,
    role,
    status,
    date,
    followUpDate,
    notes,
    resumeName: resumeData?.fileName || existingJob?.resumeName || "",
    resumeUrl: resumeData?.url || existingJob?.resumeUrl || "",
    currentPosition,
  };

  try {
    if (editIndex !== null && existingJob?._id) {
      const res = await fetchWithAuth(`/api/jobs/${existingJob._id}`, {
        method: "PUT",
        headers: apiHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Update failed");
      }
    } else {
      const res = await fetchWithAuth("/api/jobs", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Create failed");
      }
    }

    editIndex = null;
    closeForm();
    await loadJobsFromServer();
    await loadSuggestions();
    showToast("Saved.");
  } catch (e) {
    showToast(e.message || "Could not save job", false);
  }
}

function renderJobs() {
  const list = document.getElementById("jobList");
  if (!list) return;
  const search = document.getElementById("search")?.value.toLowerCase() || "";
  const filter = document.getElementById("filterStatus")?.value || "All";

  list.innerHTML = "";

  const rows = jobs
    .map((job, idx) => ({ job, idx }))
    .filter(({ job }) => {
      const cp = (job.currentPosition || "").toLowerCase();
      const matchesSearch =
        job.company.toLowerCase().includes(search) ||
        job.role.toLowerCase().includes(search) ||
        cp.includes(search);
      return matchesSearch && (filter === "All" || job.status === filter);
    });

  rows.forEach(({ job, idx }) => {
    const div = document.createElement("div");
    div.className = "job-card";
    if (job._id) div.dataset.jobId = String(job._id);
    div.dataset.jobIndex = String(idx);

    div.innerHTML = `
      <h3>${escapeHtml(job.company)}</h3>
        <p><strong>Role:</strong> ${escapeHtml(job.role)}</p>
        ${job.currentPosition ? `<p><strong>Your current title:</strong> ${escapeHtml(job.currentPosition)}</p>` : ""}
        <p><strong>Status:</strong> <span class="status ${escapeHtml(job.status)}">${escapeHtml(job.status)}</span></p>
      <p><strong>Applied:</strong> ${formatDate(job.date)}</p>
      <p><strong>Follow-up:</strong> ${formatDate(job.followUpDate)}</p>
      ${job.resumeUrl ? `<p><strong>Resume:</strong> <a href="${escapeHtml(job.resumeUrl)}" target="_blank" rel="noopener">View</a></p>` : ""}
      <p>${escapeHtml(job.notes)}</p>
      <div class="actions">
        <button type="button" data-action="edit">Edit</button>
        <button type="button" data-action="remind">Send Reminder</button>
        <button type="button" class="delete" data-action="delete">Delete</button>
      </div>
    `;

    list.appendChild(div);
  });

  updateAnalytics();
  renderNotifications();
  drawStatusViz3d();
}

function editJob(index) {
  const job = jobs[index];
  if (!job) return;

  document.getElementById("company").value = job.company;
  document.getElementById("role").value = job.role;
  document.getElementById("status").value = job.status;
  document.getElementById("date").value = job.date;
  document.getElementById("followUp").value = job.followUpDate || "";
  document.getElementById("notes").value = job.notes || "";
  const cp = document.getElementById("currentPosition");
  if (cp) cp.value = job.currentPosition || "";

  const formTitle = document.getElementById("formTitle");
  if (formTitle) formTitle.textContent = "Edit Job";

  editIndex = index;
  openForm();
}

async function deleteJob(index) {
  const job = jobs[index];
  if (!job) return;
  if (!confirm("Delete this application?")) return;

  if (job._id) {
    try {
      const res = await fetchWithAuth(`/api/jobs/${job._id}`, {
        method: "DELETE",
        headers: apiHeaders(false),
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || "Delete failed", false);
        return;
      }
    } catch {
      showToast("Network error while deleting.", false);
      return;
    }
  }

  await loadJobsFromServer();
}

function clearForm() {
  document.getElementById("company").value = "";
  document.getElementById("role").value = "";
  document.getElementById("status").value = "Applied";
  document.getElementById("date").value = "";
  document.getElementById("followUp").value = "";
  document.getElementById("resume").value = "";
  document.getElementById("notes").value = "";
  const cp = document.getElementById("currentPosition");
  if (cp) cp.value = "";
  const formTitle = document.getElementById("formTitle");
  if (formTitle) formTitle.textContent = "Add Job";
}

function openForm() {
  document.getElementById("modal").style.display = "flex";
  scheduleModalPositionSuggestions();
}

function openFormForNew() {
  editIndex = null;
  clearForm();
  openForm();
}

function closeForm() {
  clearTimeout(modalSuggestTimer);
  modalSuggestSeq += 1;
  document.getElementById("modal").style.display = "none";
  const box = document.getElementById("modalPositionSuggestions");
  if (box) {
    box.innerHTML =
      '<p class="modal-suggest-hint">Type your <strong>current job title</strong> above (or the <strong>role</strong> you are applying for) to see related ideas.</p>';
  }
  const metaEl = document.getElementById("modalPositionSuggestMeta");
  if (metaEl) metaEl.textContent = "";
  clearForm();
  editIndex = null;
}

document.getElementById("search")?.addEventListener("input", renderJobs);
document.getElementById("filterStatus")?.addEventListener("change", renderJobs);
document.getElementById("reminderEmail")?.addEventListener("input", saveReminderEmail);
document.getElementById("currentPosition")?.addEventListener("input", scheduleModalPositionSuggestions);
document.getElementById("role")?.addEventListener("input", scheduleModalPositionSuggestions);

(function setupJobListClickDelegation() {
  const list = document.getElementById("jobList");
  if (!list || list.dataset.jobClickBound === "1") return;
  list.dataset.jobClickBound = "1";
  list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const card = btn.closest(".job-card");
    if (!card || !list.contains(card)) return;

    const jobId = card.dataset.jobId;
    let index = jobId ? jobs.findIndex((j) => String(j._id) === jobId) : -1;
    if (index < 0 && card.dataset.jobIndex !== undefined) {
      const ix = Number(card.dataset.jobIndex);
      if (!Number.isNaN(ix) && jobs[ix]) index = ix;
    }
    if (index < 0 || !jobs[index]) {
      showToast("Could not find that job. Try refreshing the page.", false);
      return;
    }

    const action = btn.dataset.action;
    if (action === "edit") editJob(index);
    else if (action === "remind") sendReminder(index);
    else if (action === "delete") deleteJob(index);
  });
})();

loadReminderEmail();

/* =========================
   3D TILT (stats + header only; application cards are static)
========================= */
function setupParallaxTilt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.addEventListener("mousemove", (e) => {
    const x = (window.innerWidth / 2 - e.pageX) / 40;
    const y = (window.innerHeight / 2 - e.pageY) / 40;

    document.querySelectorAll(".stat-card[data-tilt]").forEach((card) => {
      const k = 0.45;
      card.style.transform = `perspective(1000px) rotateY(${x * k}deg) rotateX(${y * k}deg) translateY(-4px) translateZ(8px)`;
    });

    const header = document.querySelector(".dash-header[data-tilt]");
    if (header) {
      header.style.transform = `perspective(1400px) rotateX(${y * 0.12}deg) rotateY(${-x * 0.12}deg)`;
    }
  });
}

setupParallaxTilt();

/* =========================
   3D BACKGROUND + GRID FLOOR
========================= */
const canvas = document.getElementById("bgCanvas");
const ctx = canvas?.getContext("2d");

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();

let particles = [];

function initParticles() {
  if (!canvas) return;
  particles = [];
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width - canvas.width / 2,
      y: Math.random() * canvas.height - canvas.height / 2,
      z: Math.random() * canvas.width + 40,
    });
  }
}

initParticles();

let gridPhase = 0;

function drawGridFloor() {
  if (!canvas || !ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const horizon = h * 0.42;
  gridPhase += 0.35;

  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
  ctx.lineWidth = 1;
  const spacing = 48;
  const vanishX = w / 2;
  const vanishY = horizon;

  for (let i = -16; i <= 16; i++) {
    const offset = (i * spacing + (gridPhase % spacing)) * 0.6;
    const x1 = vanishX + offset * 0.15;
    const y1 = vanishY;
    const x2 = vanishX + offset * 4;
    const y2 = h + 40;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  for (let j = 0; j < 14; j++) {
    const t = j / 14;
    const y = vanishY + t * (h - vanishY + 20);
    const spread = 80 + t * (w * 0.55);
    ctx.beginPath();
    ctx.moveTo(vanishX - spread, y);
    ctx.lineTo(vanishX + spread, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles() {
  if (!canvas || !ctx) {
    return;
  }

  ctx.fillStyle = "rgba(15, 23, 42, 0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGridFloor();

  ctx.fillStyle = "rgba(255,255,255,0.85)";

  particles.forEach((p) => {
    p.z -= 2;
    if (p.z <= 10) {
      p.z = canvas.width;
      p.x = Math.random() * canvas.width - canvas.width / 2;
      p.y = Math.random() * canvas.height - canvas.height / 2;
    }

    const k = 420 / p.z;
    const x = p.x * k + canvas.width / 2;
    const y = p.y * k + canvas.height * 0.38;

    if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
      const size = Math.max(0.4, (1 - p.z / canvas.width) * 3.2);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  requestAnimationFrame(drawParticles);
}

if (canvas && ctx && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  drawParticles();
} else if (canvas && ctx) {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
});

/* =========================
   3D STATUS VIZ (isometric bars)
========================= */
function drawStatusViz3d() {
  const viz = document.getElementById("statusViz3d");
  if (!viz) return;
  const vctx = viz.getContext("2d");
  const W = viz.width;
  const H = viz.height;
  vctx.clearRect(0, 0, W, H);

  const statuses = ["Applied", "Interview", "Rejected", "Offer"];
  const colors = ["#6366f1", "#22d3ee", "#f87171", "#a78bfa"];
  const counts = statuses.map((s) => jobs.filter((j) => j.status === s).length);
  const max = Math.max(1, ...counts);

  const baseX = 56;
  const baseY = H - 36;
  const barW = 28;
  const depth = 14;

  statuses.forEach((label, i) => {
    const h = (counts[i] / max) * (H - 70);
    const x = baseX + i * 78;
    const y = baseY - h;

    vctx.fillStyle = colors[i];
    vctx.beginPath();
    vctx.moveTo(x, y);
    vctx.lineTo(x + barW, y);
    vctx.lineTo(x + barW + depth * 0.55, y - depth * 0.35);
    vctx.lineTo(x + depth * 0.55, y - depth * 0.35);
    vctx.closePath();
    vctx.fill();

    vctx.fillStyle = "rgba(255,255,255,0.22)";
    vctx.beginPath();
    vctx.moveTo(x + barW, y);
    vctx.lineTo(x + barW, baseY);
    vctx.lineTo(x + barW + depth * 0.55, baseY - depth * 0.35);
    vctx.lineTo(x + barW + depth * 0.55, y - depth * 0.35);
    vctx.closePath();
    vctx.fill();

    vctx.fillStyle = colors[i];
    vctx.globalAlpha = 0.92;
    vctx.fillRect(x, y, barW, baseY - y);
    vctx.globalAlpha = 1;

    vctx.fillStyle = "rgba(226,232,240,0.9)";
    vctx.font = "11px system-ui,sans-serif";
    vctx.fillText(String(counts[i]), x + 6, y - 10);
    vctx.fillStyle = "rgba(148,163,184,0.95)";
    vctx.font = "10px system-ui,sans-serif";
    vctx.fillText(label.slice(0, 3), x - 2, baseY + 14);
  });
}

(async function initDashboard() {
  const userLabel = document.getElementById("currentUserLabel");
  if (userLabel) {
    userLabel.textContent = currentUser.name
      ? `${currentUser.name} (${currentUser.email})`
      : currentUser.email;
  }
  await populateCareerFieldSelect();
  await loadCareerProfileForm();
  await loadJobsFromServer();
  await fetchReminderHistory();
  await loadSuggestions();
})();
