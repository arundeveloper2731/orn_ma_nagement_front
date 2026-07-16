// Shared JWT helper used by every page.
// Load this script BEFORE any other page script (script.js, login.js, etc).

const TOKEN_KEY = "jwtToken";

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// Merge an Authorization: Bearer <token> header into an existing headers object.
function authHeaders(extraHeaders = {}) {
    const token = getToken();
    return token
        ? { ...extraHeaders, "Authorization": `Bearer ${token}` }
        : extraHeaders;
}

// Convenience wrapper around fetch() that automatically attaches the JWT.
function authFetch(url, options = {}) {
    const opts = { ...options };
    opts.headers = authHeaders(opts.headers || {});
    return fetch(url, opts);
}

// ==========================
// Decode the JWT payload (client-side only, for UI display/hide decisions).
// This is NOT a security boundary — the backend independently re-checks
// ownership/role on every request. It only lets pages show/hide buttons
// without an extra round trip.
// ==========================
function getCurrentUser() {
    const token = getToken();
    if (!token) {
        return { username: null, role: null };
    }
    try {
        const payloadBase64 = token.split(".")[1];
        const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(normalized)
                .split("")
                .map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        );
        const payload = JSON.parse(json);
        return { username: payload.sub || null, role: payload.role || null };
    } catch (e) {
        console.error("Unable to decode token", e);
        return { username: null, role: null };
    }
}

function isCurrentUserAdmin() {
    return getCurrentUser().role === "ADMIN";
}
