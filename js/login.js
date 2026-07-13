const API = "https://orn-ma-nagement.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginform");
    const errorBox = document.getElementById("loginError");

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!username) {
            alert("Please enter your username");
            return;
        }

        if (!password) {
            alert("Please enter your password");
            return;
        }

        if (errorBox) {
            errorBox.style.display = "none";
        }

        try {

            const response = await fetch(`${API}/api/auth/login`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    password: password
                })

            });

            if (response.ok) {

                alert("Login Successful");

                localStorage.setItem("loggedInUser", username);

                window.location.href = "dashboard.html";

            } else {

                const message = await response.text();

                if (errorBox) {
                    errorBox.innerText = message;
                    errorBox.style.display = "block";
                } else {
                    alert(message);
                }

            }

        } catch (error) {

            console.error("Login Error:", error);

            alert("Unable to connect to the server.");

        }

    });

});