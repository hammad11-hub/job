const API_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:5000"
  : "https://job-backend-production-734e.up.railway.app";

let currentUser;
try {
  currentUser = JSON.parse(localStorage.getItem("jobTrackerUser") || "null");
} catch {
  currentUser = null;
}
const authToken = localStorage.getItem("jobTrackerToken") || "";

if (!currentUser?.id || currentUser.role !== "employer") {
  window.location.replace("../login.html");
}

let employerJobs = [];
let stats = {};

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
      ...apiHeaders(!(options.body instanceof FormData))
    },
  });
}

function logout() {
  localStorage.removeItem("jobTrackerUser");
  localStorage.removeItem("jobTrackerToken");
  window.location.replace("../login.html");
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

async function loadStats() {
  try {
    const res = await fetchWithAuth("/api/employer/stats");
    if (!res.ok) return;
    stats = await res.json();
    document.getElementById("totalJobs").textContent = stats.totalJobs || 0;
    document.getElementById("featuredJobs").textContent = stats.featuredJobs || 0;
    document.getElementById("totalApplicants").textContent = stats.totalApplicants || 0;
    renderPlanLimits(stats.limits);
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

function renderPlanLimits(limits) {
  const container = document.getElementById("planLimits");
  if (!container || !limits) return;
  
  const maxJobs = limits.maxActiveJobs === null || limits.maxActiveJobs === Infinity ? "Unlimited" : limits.maxActiveJobs;
  
  container.innerHTML = `
    <div class="limit-item">
      <span>Max Active Jobs:</span>
      <strong>${maxJobs}</strong>
    </div>
    <div class="limit-item">
      <span>Featured Jobs/Month:</span>
      <strong>${limits.featuredJobsPerMonth}</strong>
    </div>
    <div class="limit-item">
      <span>AI Match Scores:</span>
      <strong>${limits.canViewAIScores ? "Yes" : "No"}</strong>
    </div>
    <div class="limit-item">
      <span>CSV Export:</span>
      <strong>${limits.canExportCSV ? "Yes" : "No"}</strong>
    </div>
  `;
}

async function loadEmployerJobs() {
  try {
    // Note: We need a route to get employer's jobs. The employer router has /stats but not a list jobs.
    // Wait, let's check Backend/routes/employer.js again.
    // Actually, we can use the main /api/jobs but filtered by employer? No, the backend doesn't have that yet.
    // I should add a GET /api/employer/jobs route.
    const res = await fetchWithAuth("/api/employer/jobs");
    if (!res.ok) return;
    const data = await res.json();
    employerJobs = data.jobs || [];
    renderEmployerJobs();
  } catch (err) {
    console.error("Error loading jobs:", err);
  }
}

function renderEmployerJobs() {
  const list = document.getElementById("employerJobList");
  if (!list) return;
  list.innerHTML = "";

  if (employerJobs.length === 0) {
    list.innerHTML = "<div class='empty-state'>You haven't posted any jobs yet.</div>";
    return;
  }

  employerJobs.forEach((job) => {
    const div = document.createElement("div");
    div.className = "job-card";
    div.innerHTML = `
      <div class="job-card-header">
        <h3>${escapeHtml(job.title)}</h3>
        ${job.featured ? '<span class="badge badge-gold">Featured</span>' : ""}
      </div>
      <p><strong>Status:</strong> ${job.status}</p>
      <p><strong>Location:</strong> ${escapeHtml(job.location)}</p>
      <div class="actions">
        <button onclick="viewApplicants('${job._id}', '${escapeHtml(job.title)}')">View Applicants</button>
        <button onclick="exportApplicants('${job._id}')">Export CSV</button>
        ${!job.featured ? `<button class="accent-btn" onclick="promptFeature('${job._id}')">Feature Job</button>` : ""}
      </div>
    `;
    list.appendChild(div);
  });
}

async function viewApplicants(jobId, jobTitle) {
  try {
    const res = await fetchWithAuth(`/api/employer/jobs/${jobId}/applicants`);
    if (!res.ok) {
      showToast("Failed to load applicants.", false);
      return;
    }
    const data = await res.json();
    renderApplicantsModal(jobTitle, data.applicants);
  } catch (err) {
    showToast("Error loading applicants.", false);
  }
}

function renderApplicantsModal(jobTitle, applicants) {
  // Create or update modal for applicants
  let modal = document.getElementById("applicantsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "applicantsModal";
    modal.className = "modal";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px;">
      <h2>Applicants for ${escapeHtml(jobTitle)}</h2>
      <div class="applicant-list" style="margin-top: 20px;">
        ${applicants.length === 0 ? "<p>No applicants yet.</p>" : applicants.map(app => `
          <div class="applicant-item" style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${escapeHtml(app.applicant?.name || "Unknown")}</strong><br>
              <small>${escapeHtml(app.applicant?.email || "")}</small>
            </div>
            <div>
              ${app.aiMatchScore !== undefined ? `<span class="badge" style="background: rgba(34, 211, 238, 0.2); color: #a5f3fc;">AI Score: ${app.aiMatchScore}%</span>` : `<small>Upgrade to Pro for AI scores</small>`}
              <span class="badge">${escapeHtml(app.status)}</span>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="modal-actions">
        <button class="secondary-btn" onclick="document.getElementById('applicantsModal').style.display='none'">Close</button>
      </div>
    </div>
  `;
  modal.style.display = "flex";
}

async function exportApplicants(jobId) {
  try {
    const res = await fetchWithAuth(`/api/employer/jobs/${jobId}/applicants/export`);
    if (res.status === 403) {
      showToast("CSV Export requires an Enterprise plan.", false);
      return;
    }
    if (!res.ok) {
      showToast("Failed to export applicants.", false);
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applicants-${jobId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    showToast("Error exporting applicants.", false);
  }
}

function openJobForm() {
  document.getElementById("jobModal").style.display = "flex";
}

function closeJobForm() {
  document.getElementById("jobModal").style.display = "none";
}

async function saveJob() {
  const jobData = {
    title: document.getElementById("jobTitle").value,
    company: document.getElementById("jobCompany").value,
    location: document.getElementById("jobLocation").value,
    type: document.getElementById("jobType").value,
    category: document.getElementById("jobCategory").value,
    experienceLevel: document.getElementById("jobExperience").value,
    salary: {
      min: document.getElementById("salaryMin").value,
      max: document.getElementById("salaryMax").value,
      currency: "PKR"
    },
    description: document.getElementById("jobDescription").value
  };

  try {
    const res = await fetchWithAuth("/api/employer/jobs", {
      method: "POST",
      body: JSON.stringify(jobData)
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || "Failed to post job", false);
      if (data.error === "JOB_LIMIT_REACHED") {
        window.location.href = "/pricing";
      }
      return;
    }
    showToast("Job posted successfully!");
    closeJobForm();
    loadEmployerJobs();
    loadStats();
    
    // Prompt for featuring
    if (currentUser.featuredJobsRemaining > 0) {
      promptFeature(data.job._id);
    }
  } catch (err) {
    showToast("Error saving job.", false);
  }
}

let pendingFeatureJobId = null;
function promptFeature(jobId) {
  pendingFeatureJobId = jobId;
  document.getElementById("featuredRemainingText").textContent = `You have ${currentUser.featuredJobsRemaining || 0} featured slots remaining this month.`;
  document.getElementById("featureModal").style.display = "flex";
}

function closeFeatureModal() {
  document.getElementById("featureModal").style.display = "none";
  pendingFeatureJobId = null;
}

document.getElementById("confirmFeatureBtn").onclick = async () => {
  if (!pendingFeatureJobId) return;
  try {
    const res = await fetchWithAuth(`/api/employer/jobs/${pendingFeatureJobId}/feature`, {
      method: "POST"
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || "Failed to feature job", false);
      return;
    }
    showToast("Job featured successfully!");
    closeFeatureModal();
    loadEmployerJobs();
    loadStats();
    loadBillingStatus(); // Refresh user info for remaining slots
  } catch (err) {
    showToast("Error featuring job.", false);
  }
};

async function loadBillingStatus() {
  try {
    const res = await fetchWithAuth("/api/payments/subscription");
    if (!res.ok) return;
    const data = await res.json();
    currentUser = { ...currentUser, ...data };
    localStorage.setItem("jobTrackerUser", JSON.stringify(currentUser));
    renderPlanBadge();
  } catch (err) {}
}

function renderPlanBadge() {
  const badge = document.getElementById("planBadge");
  const action = document.getElementById("billingActionButton");
  if (badge) {
    const planLabel = currentUser.plan ? currentUser.plan.toUpperCase() : "FREE";
    badge.textContent = `${planLabel} plan`;
  }
  if (!action) return;
  if (currentUser.plan === "free") {
    action.textContent = "Upgrade";
    action.onclick = () => {
      window.location.href = "/pricing";
    };
  } else {
    action.textContent = "Manage Billing";
    action.onclick = handleBillingAction;
  }
}

async function handleBillingAction() {
  try {
    const res = await fetchWithAuth("/api/payments/portal-session", {
      method: "POST"
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || data.message || "Unable to open billing portal", false);
      return;
    }
    if (data.url) {
      window.location.href = data.url;
    }
  } catch {
    showToast("Unable to open billing portal.", false);
  }
}

function escapeHtml(s) {
  if (s == null) return "";
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

(async function init() {
  const userLabel = document.getElementById("currentUserLabel");
  if (userLabel) {
    userLabel.textContent = currentUser.name
      ? `${currentUser.name} (${currentUser.email})`
      : currentUser.email;
  }
  
  // Check for payment success banner
  const params = new URLSearchParams(window.location.search);
  if (params.get("payment") === "success") {
    showToast("Your Pro plan is now active!", true);
  }

  await loadBillingStatus();
  await loadStats();
  await loadEmployerJobs();
})();
