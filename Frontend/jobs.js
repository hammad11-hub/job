const API_URL = "";

const state = {
  keyword: "",
  location: "",
  types: [],
  experience: "any",
  salaryMin: "",
  salaryMax: "",
  category: "",
  remote: false,
  featured: false,
  page: 1,
  limit: 10,
  totalPages: 1,
  total: 0,
};

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

function buildQueryParams() {
  const params = new URLSearchParams();
  if (state.keyword) params.set("keyword", state.keyword);
  if (state.location) params.set("location", state.location);
  state.types.forEach((type) => params.append("type", type));
  if (state.category) params.set("category", state.category);
  if (state.experience && state.experience !== "any") params.set("experience", state.experience);
  if (state.salaryMin) params.set("salaryMin", state.salaryMin);
  if (state.salaryMax) params.set("salaryMax", state.salaryMax);
  if (state.remote) params.set("remote", "true");
  if (state.featured) params.set("featured", "true");
  params.set("page", String(state.page));
  params.set("limit", String(state.limit));
  params.set("sort", "newest");
  return params.toString();
}

function updateSalaryLabel() {
  const min = state.salaryMin ? Number(state.salaryMin).toLocaleString() : "0";
  const max = state.salaryMax ? Number(state.salaryMax).toLocaleString() : "0";
  document.getElementById("salaryLabel").textContent = `PKR ${min} — PKR ${max}`;
}

function setFiltersFromInputs() {
  state.keyword = document.getElementById("keyword").value.trim();
  state.location = document.getElementById("location").value.trim();
  state.types = Array.from(document.querySelectorAll("input[name='type']:checked")).map((input) => input.value);
  state.experience = document.querySelector("input[name='experience']:checked"]).value;
  state.salaryMin = document.getElementById("salaryMin").value.trim();
  state.salaryMax = document.getElementById("salaryMax").value.trim();
  state.category = document.getElementById("category").value;
  state.remote = document.getElementById("remoteOnly").checked;
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API_URL}/api/jobs/categories`);
    if (!res.ok) return;
    const data = await res.json();
    const select = document.getElementById("category");
    data.categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.category;
      option.textContent = `${category.category} (${category.count})`;
      select.appendChild(option);
    });
  } catch {
    // ignore
  }
}

function renderJobs(jobs) {
  const grid = document.getElementById("jobsGrid");
  grid.innerHTML = "";
  if (!jobs.length) {
    grid.innerHTML = "<div class=\"empty-state\">No jobs found matching your filters.</div>";
    return;
  }

  jobs.forEach((job) => {
    const salaryText = job.salary?.min && job.salary?.max
      ? `PKR ${Number(job.salary.min).toLocaleString()} — PKR ${Number(job.salary.max).toLocaleString()}`
      : "Salary not listed";
    const posted = job.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(job.createdAt)) / 86400000)) : 0;
    const card = document.createElement("article");
    card.className = "job-card";
    card.innerHTML = `
      <div class="job-card-header">
        <h3>${job.title}</h3>
        ${job.featured ? '<span class="badge badge-gold">Featured</span>' : ""}
      </div>
      <p class="job-company">${job.company}</p>
      <div class="job-meta-row">
        <span>${job.location || "Remote"}</span>
        <span>${salaryText}</span>
      </div>
      <div class="job-meta-row">
        <span class="badge badge-secondary">${job.type}</span>
        <span>${posted} days ago</span>
      </div>
      <div class="job-footer">
        <span class="bookmark">☆</span>
        <a class="btn small" href="job-detail.html?id=${job._id}">View details</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderPagination() {
  const container = document.getElementById("pagination");
  container.innerHTML = "";
  if (state.totalPages <= 1) return;

  const pageCount = Math.min(state.totalPages, 10);
  for (let i = 1; i <= pageCount; i += 1) {
    const btn = document.createElement("button");
    btn.className = i === state.page ? "page-button active" : "page-button";
    btn.textContent = i;
    btn.addEventListener("click", () => {
      state.page = i;
      fetchJobs();
    });
    container.appendChild(btn);
  }
}

async function fetchJobs() {
  setFiltersFromInputs();
  updateSalaryLabel();
  const summary = document.getElementById("resultsSummary");
  summary.textContent = "Loading jobs...";
  try {
    const query = buildQueryParams();
    const res = await fetch(`${API_URL}/api/jobs?${query}`);
    if (!res.ok) {
      summary.textContent = "Unable to load jobs right now.";
      return;
    }
    const data = await res.json();
    state.total = data.total || 0;
    state.totalPages = data.totalPages || 1;
    summary.textContent = `${state.total} jobs found · page ${state.page} of ${state.totalPages}`;
    renderJobs(Array.isArray(data.jobs) ? data.jobs : []);
    renderPagination();
  } catch (err) {
    summary.textContent = "Unable to load jobs right now.";
  }
}

function clearFilters() {
  document.getElementById("keyword").value = "";
  document.getElementById("location").value = "";
  document.querySelectorAll("input[name='type']").forEach((input) => { input.checked = false; });
  document.querySelector("input[name='experience'][value='any']").checked = true;
  document.getElementById("salaryMin").value = "";
  document.getElementById("salaryMax").value = "";
  document.getElementById("category").value = "";
  document.getElementById("remoteOnly").checked = false;
  state.page = 1;
  fetchJobs();
}

function setupDrawer() {
  const sidebar = document.getElementById("filterSidebar");
  const open = document.getElementById("openFilters");
  const close = document.getElementById("closeFilters");
  open.addEventListener("click", () => sidebar.classList.add("mobile-open"));
  close.addEventListener("click", () => sidebar.classList.remove("mobile-open"));
}

function bindEvents() {
  const debouncedFetch = debounce(() => { state.page = 1; fetchJobs(); }, 400);
  ["keyword", "location"].forEach((id) => {
    document.getElementById(id).addEventListener("input", debouncedFetch);
  });
  document.querySelectorAll("input[name='type']").forEach((input) => input.addEventListener("change", () => { state.page = 1; fetchJobs(); }));
  document.querySelectorAll("input[name='experience']").forEach((input) => input.addEventListener("change", () => { state.page = 1; fetchJobs(); }));
  ["salaryMin", "salaryMax"].forEach((id) => {
    document.getElementById(id).addEventListener("input", debouncedFetch);
  });
  document.getElementById("category").addEventListener("change", () => { state.page = 1; fetchJobs(); });
  document.getElementById("remoteOnly").addEventListener("change", () => { state.page = 1; fetchJobs(); });
  document.getElementById("applyFilters").addEventListener("click", () => { state.page = 1; fetchJobs(); });
  document.getElementById("clearFilters").addEventListener("click", (event) => {
    event.preventDefault();
    clearFilters();
  });
  setupDrawer();
}

window.addEventListener("DOMContentLoaded", async () => {
  await fetchCategories();
  bindEvents();
  fetchJobs();
});
