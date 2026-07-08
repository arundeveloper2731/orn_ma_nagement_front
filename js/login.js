document.addEventListener("DOMContentLoaded", () => {
    const loginform = document.getElementById("loginform");
    const errorBox = document.getElementById("loginError");
    const logoutBox = document.getElementById("logoutMessage");

    // Show a "logged out" message if we were redirected here after logout
    const params = new URLSearchParams(window.location.search);
    if (params.has("logout") && logoutBox) {
        logoutBox.style.display = "block";
    }

    loginform.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (errorBox) errorBox.style.display = "none";

        if (username === "") {
            alert("Enter username");
            return;
        }
        if (password === "") {
            alert("Enter password");
            return;
        }

        try {
            const body = new URLSearchParams();
            body.append("username", username);
            body.append("password", password);

            const response = await fetch(`${API}/login`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: body
            });

            if (response.ok) {
                window.location.href = "dashboard.html";
            } else if (errorBox) {
                errorBox.style.display = "block";
            } else {
                alert("Invalid username or password");
            }
        } catch (err) {
            console.error(err);
            alert("Server error. Please try again.");
        }
    });
});
