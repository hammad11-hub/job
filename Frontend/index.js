const API_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:5000"
  : "https://job-backend-production-734e.up.railway.app";

const card = document.getElementById("card");

document.addEventListener("mousemove", (e) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const x = (window.innerWidth / 2 - e.pageX) / 25;
  const y = (window.innerHeight / 2 - e.pageY) / 25;
  card.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
});

document.addEventListener("mouseleave", () => {
  card.style.transform = "rotateY(0deg) rotateX(0deg)";
});

let isLogin = true;

function toggleForm() {
  isLogin = !isLogin;
  document.getElementById("formTitle").innerText = isLogin ? "Login" : "Register";
  document.getElementById("nameField").style.display = isLogin ? "none" : "block";
  document.getElementById("roleField").style.display = isLogin ? "none" : "block";
  document.querySelector(".toggle").innerText = isLogin ? "Switch to Register" : "Switch to Login";
}

async function handleSubmit() {
  const error = document.getElementById("error");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const name = document.getElementById("name")?.value.trim() || "";
  const role = document.getElementById("role")?.value || "jobseeker";

  if (!email || !password) {
    error.style.color = "yellow";
    error.innerText = "Please fill all fields!";
    return;
  }

  error.innerText = "";

  if (isLogin) {
    try {
      const res = await fetch(API_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user && data.token) {
        localStorage.setItem("jobTrackerUser", JSON.stringify(data.user));
        localStorage.setItem("jobTrackerToken", data.token);
        if (data.user.role === "employer") {
          window.location.href = "./dashboard/employer-dashboard.html";
        } else {
          window.location.href = "./dashboard/dashboard.html";
        }
      } else {
        error.style.color = "yellow";
        error.innerText = data.message || "Invalid login response.";
      }
    } catch {
      error.style.color = "yellow";
      error.innerText = "Server error! Please open the app from your deployed domain (or start the backend server).";
    }
  } else {
    try {
      const res = await fetch(API_URL + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toggleForm();
        error.style.color = "lightgreen";
        error.innerText = "Registered! Please log in.";
      } else {
        error.style.color = "yellow";
        error.innerText = data.message || "Registration failed!";
      }
    } catch {
      error.style.color = "yellow";
      error.innerText = "Server error! Please open the app from your deployed domain (or start the backend server).";
    }
  }
}

function setGoogleAuthButton() {
  const googleButton = document.getElementById("googleAuth");
  if (!googleButton) return;
  googleButton.href = `${API_URL}/api/auth/google`;
}

function parseQueryString() {
  return new URLSearchParams(window.location.search);
}

async function handleOAuthRedirect() {
  const params = parseQueryString();
  const token = params.get("token");
  if (!token) return;

  localStorage.setItem("jobTrackerToken", token);
  try {
    const res = await fetch(`${API_URL}/api/me`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.user) {
      localStorage.setItem("jobTrackerUser", JSON.stringify(data.user));
      window.location.href = "./dashboard/dashboard.html";
      return;
    }
  } catch (e) {
    console.error("OAuth callback error", e);
  }
}

setGoogleAuthButton();
handleOAuthRedirect();
