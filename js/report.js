function toggleMenu() {
    document.querySelector(".sidebar")
        .classList.toggle("active");
}
const API = "https://orn-ma-nagement.onrender.com";

function logout() {
    fetch(`${API}/logout`, { method: "POST", credentials: "include" })
        .finally(() => {
            localStorage.removeItem("loggedInUser");
            window.location.href = "login.html";
        });
}


const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const status = document.getElementById("status");

const searchBtn = document.querySelector(".search-btn");
const exportExcelBtn = document.querySelector(".export");
const exportPdfBtn = document.querySelector(".pdf");

const reportTable = document.getElementById("reportTable");

// Summary Cards
const totalOrn = document.getElementById("totalOrn");
const matched = document.getElementById("matched");
const unmatched = document.getElementById("unmatched");
const expense = document.getElementById("expense");

async function loadSummary() {

    try {

        const response = await fetch(`${API}/api/reports/summary`, { credentials: "include", headers: authHeaders() });

        if (!response.ok)
            throw new Error("Unable to load summary");

        const data = await response.json();

        totalOrn.textContent = data.totalOrn;
        matched.textContent = data.matched;
        unmatched.textContent = data.unmatched;
        expense.textContent = "₹" + data.totalExpense.toFixed(2);

    } catch (err) {

        console.error(err);

    }

}

async function loadReports() {

    try {

        let url = `${API}/api/reports?`;

        if (fromDate.value)
            url += "from=" + fromDate.value + "&";

        if (toDate.value)
            url += "to=" + toDate.value + "&";

        if (status.value !== "All")
            url += "status=" + status.value + "&";


        const response = await fetch(url, { credentials: "include", headers: authHeaders() });

        if (!response.ok)
            throw new Error("Failed to load report");

        const reports = await response.json();

        reportTable.innerHTML = "";

        if (reports.length === 0) {

            reportTable.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        No Records Found
                    </td>
                </tr>
            `;

            return;
        }

        reports.forEach(report => {

            reportTable.innerHTML += `
                <tr>
                    <td>${report.ornNumber}</td>
                    <td>${report.customer}</td>
                    <td>${report.location}</td>
                    <td>${report.status}</td>
                    <td>₹${report.expense}</td>
                    <td>${report.date}</td>
                </tr>
            `;

        });

    } catch (err) {

        console.error(err);

    }

}

searchBtn.addEventListener("click", () => {

    loadReports();

});

exportExcelBtn.addEventListener("click", async () => {

    let url = `${API}/api/reports/export/excel?`;

    if (fromDate.value)
        url += "from=" + fromDate.value + "&";

    if (toDate.value)
        url += "to=" + toDate.value + "&";

    if (status.value !== "All")
        url += "status=" + status.value + "&";

    await downloadWithAuth(url, "report.xlsx");

});

exportPdfBtn.addEventListener("click", async () => {

    let url = `${API}/api/reports/export/pdf?`;

    if (fromDate.value)
        url += "from=" + fromDate.value + "&";

    if (toDate.value)
        url += "to=" + toDate.value + "&";

    if (status.value !== "All")
        url += "status=" + status.value + "&";

    await downloadWithAuth(url, "report.pdf");

});

// Protected export endpoints require the Authorization header, which a plain
// browser navigation (window.location.href) cannot send. Fetch the file with
// the JWT attached instead, then trigger the download from the blob.
async function downloadWithAuth(url, fallbackFileName) {

    try {

        const response = await fetch(url, { credentials: "include", headers: authHeaders() });

        if (!response.ok) {
            throw new Error("Export failed");
        }

        const disposition = response.headers.get("Content-Disposition") || "";
        const match = disposition.match(/filename="?([^"]+)"?/);
        const fileName = match ? match[1] : fallbackFileName;

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);

    } catch (err) {

        console.error(err);
        alert("Unable to export report");

    }

}

window.onload = () => {

    loadSummary();
    loadReports();

};