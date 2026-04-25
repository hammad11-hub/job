/** Curated hints per broad field — used for rule-based “adjacent role” suggestions. */
export const CAREER_FIELDS = [
  "software",
  "data",
  "design",
  "healthcare",
  "finance",
  "trades",
  "education",
  "marketing",
  "other",
];

export const FIELD_PACKS = {
  software: {
    label: "Software & IT",
    adjacentTitles: [
      "Backend Engineer",
      "Frontend Engineer",
      "Full Stack Developer",
      "DevOps / SRE",
      "QA Automation Engineer",
      "Mobile Developer",
      "Security Engineer",
    ],
    boards: [
      { name: "Wellfound (AngelList)", url: "https://wellfound.com/" },
      { name: "GitHub Jobs (community)", url: "https://github.com/" },
    ],
    keywords: ["engineer", "developer", "software", "devops", "full stack", "backend", "frontend"],
  },
  data: {
    label: "Data & Analytics",
    adjacentTitles: [
      "Data Analyst",
      "Data Scientist",
      "Analytics Engineer",
      "Business Intelligence Analyst",
      "Machine Learning Engineer",
      "Data Engineer",
    ],
    boards: [
      { name: "Kaggle Jobs", url: "https://www.kaggle.com/jobs" },
      { name: "Towards Data Science (guides)", url: "https://towardsdatascience.com/" },
    ],
    keywords: ["data", "analyst", "scientist", "analytics", "bi ", "sql", "machine learning"],
  },
  design: {
    label: "Design & Creative",
    adjacentTitles: [
      "Product Designer",
      "UX Designer",
      "UI Designer",
      "UX Researcher",
      "Brand Designer",
      "Motion Designer",
    ],
    boards: [
      { name: "Dribbble Jobs", url: "https://dribbble.com/jobs" },
      { name: "Behance", url: "https://www.behance.net/joblist" },
    ],
    keywords: ["design", "ux", "ui", "product designer", "figma", "creative"],
  },
  healthcare: {
    label: "Healthcare",
    adjacentTitles: [
      "Registered Nurse",
      "Medical Assistant",
      "Healthcare Administrator",
      "Clinical Research Coordinator",
      "Physical Therapist",
      "Pharmacy Technician",
    ],
    boards: [
      { name: "Health eCareers", url: "https://healthecareers.com/" },
      { name: "HospitalCareers", url: "https://www.hospitalcareers.com/" },
    ],
    keywords: ["nurse", "clinical", "medical", "healthcare", "patient", "hospital"],
  },
  finance: {
    label: "Finance & Accounting",
    adjacentTitles: [
      "Financial Analyst",
      "Staff Accountant",
      "Payroll Specialist",
      "Credit Analyst",
      "Bookkeeper",
      "Compliance Analyst",
    ],
    boards: [
      { name: "eFinancialCareers", url: "https://www.efinancialcareers.com/" },
      { name: "Robert Half", url: "https://www.roberthalf.com/" },
    ],
    keywords: ["finance", "accounting", "analyst", "cpa", "bookkeeper", "audit"],
  },
  trades: {
    label: "Trades & Skilled Labor",
    adjacentTitles: [
      "Electrician",
      "HVAC Technician",
      "Plumber",
      "Welder",
      "Carpenter",
      "Automotive Technician",
    ],
    boards: [
      { name: "Indeed (trade filters)", url: "https://www.indeed.com/" },
      { name: "ZipRecruiter", url: "https://www.ziprecruiter.com/" },
    ],
    keywords: ["electrician", "hvac", "plumber", "welder", "technician", "installer"],
  },
  education: {
    label: "Education & Training",
    adjacentTitles: [
      "Teacher",
      "Instructional Designer",
      "Corporate Trainer",
      "School Counselor",
      "Tutor",
      "Education Coordinator",
    ],
    boards: [
      { name: "HigherEdJobs", url: "https://www.higheredjobs.com/" },
      { name: "TeachAway", url: "https://www.teachaway.com/" },
    ],
    keywords: ["teacher", "education", "instructor", "curriculum", "training", "school"],
  },
  marketing: {
    label: "Marketing & Growth",
    adjacentTitles: [
      "Digital Marketing Specialist",
      "Content Strategist",
      "SEO Specialist",
      "Growth Marketing Manager",
      "Social Media Manager",
      "Marketing Analyst",
    ],
    boards: [
      { name: "GrowthHackers Jobs", url: "https://growthhackers.com/jobs" },
      { name: "MarketingHire", url: "https://www.marketinghire.com/" },
    ],
    keywords: ["marketing", "growth", "seo", "content", "brand", "campaign"],
  },
  other: {
    label: "General / Other",
    adjacentTitles: [
      "Operations Coordinator",
      "Project Coordinator",
      "Customer Success",
      "Administrative Assistant",
      "Executive Assistant",
      "Office Manager",
    ],
    boards: [
      { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/" },
      { name: "Glassdoor", url: "https://www.glassdoor.com/Job/index.htm" },
    ],
    keywords: [],
  },
};

export function tokenizeRole(role) {
  if (!role || typeof role !== "string") return [];
  return role
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}
