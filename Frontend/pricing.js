const API_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:5000"
  : "https://job-backend-production-734e.up.railway.app";

function getAuthToken() {
  return localStorage.getItem("jobTrackerToken") || "";
}

function apiHeaders(json = true) {
  const headers = {};
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function createCheckout(plan) {
  try {
    const res = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ plan }),
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || data.message || "Unable to start checkout.");
      return;
    }
    if (data.sessionUrl) {
      window.location.href = data.sessionUrl;
    }
  } catch (err) {
    alert("Unable to start checkout.");
  }
}

function setBanner(message, success = true) {
  const banner = document.getElementById("paymentBanner");
  const text = document.getElementById("paymentBannerText");
  if (!banner || !text) return;
  text.textContent = message;
  banner.hidden = false;
  banner.style.backgroundColor = success ? "rgba(16, 185, 129, 0.14)" : "rgba(248, 113, 113, 0.14)";
  banner.style.borderColor = success ? "rgba(34, 197, 94, 0.2)" : "rgba(248, 113, 113, 0.2)";
}

(function initPricingPage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("payment") === "success") {
    setBanner("Your Pro plan is now active!", true);
  } else if (params.get("payment") === "cancelled") {
    setBanner("Payment was cancelled. You can try again anytime.", false);
  }
})();
