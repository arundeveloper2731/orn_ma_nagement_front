function toggleMenu() {
    document.querySelector(".sidebar")
        .classList.toggle("active");
}
const API = "https://ornmanagement-production-c695.up.railway.app";

function logout() {
    fetch(`${API}/logout`, { method: "POST", credentials: "include" })
        .finally(() => {
            localStorage.removeItem("loggedInUser");
            window.location.href = "login.html";
        });
}

const runMatchBtn = document.getElementById("runMatchBtn");
const tableBody = document.getElementById("tableBody");

const emptyState = document.getElementById("emptyState");
const resultSection = document.getElementById("resultSection");

const matchedCount = document.getElementById("matchedCount");
const unmatchedCount = document.getElementById("unmatchedCount");
const missingManualCount = document.getElementById("missingManualCount");
const duplicateCount = document.getElementById("duplicateCount");

const detailModal = document.getElementById("detailModal");
const closeModal = document.getElementById("closeModal");

const manualBody = document.getElementById("manualBody");
const excelBody = document.getElementById("excelBody");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const excelFileSelect = document.getElementById("excelFileSelect");
const manualOrnInput = document.getElementById("manualOrnInput");
const manualOrnList = document.getElementById("manualOrnList");

let allData = [];

loadExcelFileOptions();
loadManualOrnOptions();

runMatchBtn.addEventListener("click", runMatching);

closeModal.addEventListener("click", () => {
    detailModal.style.display = "none";
});

window.onclick = function (event) {
    if (event.target == detailModal) {
        detailModal.style.display = "none";
    }
};

searchInput.addEventListener("keyup", filterTable);
statusFilter.addEventListener("change", filterTable);

async function loadExcelFileOptions() {

    try {

        const response = await fetch(`${API}/api/excel/files`, { credentials: "include" });

        if (!response.ok) return;

        const files = await response.json();

        files.forEach(f => {

            const opt = document.createElement("option");
            opt.value = f.fileName;
            opt.textContent = `${f.fileName} (${f.recordCount} records)`;
            excelFileSelect.appendChild(opt);

        });

    } catch (e) {

        console.log("Unable to load excel file list", e);

    }

}

async function loadManualOrnOptions() {

    try {

        const response = await fetch(`${API}/api/orn`, { credentials: "include" });

        if (!response.ok) return;

        const entries = await response.json();

        // De-duplicate ORN numbers before populating the searchable dropdown
        const seen = new Set();

        entries.forEach(entry => {

            const orn = entry.ornNo;
            if (!orn || seen.has(orn.toUpperCase())) return;

            seen.add(orn.toUpperCase());

            const opt = document.createElement("option");
            opt.value = orn;
            manualOrnList.appendChild(opt);

        });

    } catch (e) {

        console.log("Unable to load manual ORN list", e);

    }

}

async function runMatching() {

    const fileName = excelFileSelect.value;
    const manualOrn = manualOrnInput.value.trim() || "all";

    runMatchBtn.disabled = true;
    excelFileSelect.disabled = true;
    manualOrnInput.disabled = true;
    runMatchBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Matching...`;

    try {

        const response = await fetch(
            `${API}/api/matching/run?fileName=` + encodeURIComponent(fileName) +
            "&manualOrn=" + encodeURIComponent(manualOrn),
            { method: "POST", credentials: "include" }
        );

        if (!response.ok) {
            throw new Error("Unable to fetch");
        }

        const data = await response.json();

        allData = data;

        fillTable(data);

        updateCards(data);

        emptyState.classList.add("hidden");

        resultSection.classList.remove("hidden");

    } catch (e) {

        alert("Matching Failed");

        console.log(e);

    } finally {

        runMatchBtn.disabled = false;
        excelFileSelect.disabled = false;
        manualOrnInput.disabled = false;
        runMatchBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Run Matching`;

    }

}

function fillTable(data) {

    tableBody.innerHTML = "";

    data.forEach(item => {

        tableBody.innerHTML += `

        <tr>

            <td>${item.manualOrn ?? item.orn ?? "-"}</td>

            <td>${item.customerName ?? "-"}</td>

            <td>${item.mobileNumber ?? "-"}</td>

            <td>${item.excelOrn ?? "-"}</td>

            <td>

                <span class="status ${statusClass(item.status)}">

                    ${item.status}

                </span>

            </td>

            <td>${item.matchPercentage}%</td>

            <td>

                <button class="view-btn"

                    onclick="viewDetails('${item.orn}')">

                    View

                </button>

            </td>

        </tr>

        `;

    });

}

function statusClass(status) {

    switch (status) {

        case "Matched":

            return "matched";

        case "Unmatched":

            return "unmatched";

        case "Missing Excel":

            return "missingexcel";

        case "Missing Manual":

            return "missingmanual";

        case "Duplicate":

            return "duplicate";

        default:

            return "";
    }

}

function updateCards(data) {

    matchedCount.innerText =
        data.filter(x => x.status == "Matched").length;

    unmatchedCount.innerText =
        data.filter(x => x.status == "Unmatched").length;

    missingManualCount.innerText =
        data.filter(x => x.status == "Missing Manual").length;

    duplicateCount.innerText =
        data.filter(x => x.status == "Duplicate").length;

}

function filterTable() {

    const search = searchInput.value.toLowerCase();

    const status = statusFilter.value;

    let filtered = allData.filter(item => {

        const manualOrnVal = (item.manualOrn ?? item.orn ?? "").toLowerCase();
        const excelOrnVal = (item.excelOrn ?? "").toLowerCase();

        const ornMatch = manualOrnVal.includes(search) || excelOrnVal.includes(search);

        const statusMatch =
            status == "all" || item.status == status;

        return ornMatch && statusMatch;

    });

    fillTable(filtered);

}

// Fields that have a direct counterpart on the other side, used to
// decide which rows get a green (match) or red (mismatch) highlight.
const COMPARISON_PAIRS = [
    { manualKey: "ornNo", excelKey: "orn" },
    { manualKey: "amount", excelKey: "price" },
    { manualKey: "transactionDate", excelKey: "cafDate" }
];

async function viewDetails(orn) {

    try {

        const fileName = excelFileSelect.value;

        const response = await fetch(
            `${API}/api/matching/details/` + encodeURIComponent(orn) +
            "?fileName=" + encodeURIComponent(fileName),
            { credentials: "include" }
        );

        const data = await response.json();

        loadManual(data.manual, data.excel);

        loadExcel(data.excel, data.manual, data.duplicateExcelRecords);

        detailModal.style.display = "flex";

    }

    catch (e) {

        console.log(e);

        alert("Unable to load details");

    }

}

function compareStatusFor(key, side, manual, excel) {

    const pair = COMPARISON_PAIRS.find(p =>
        (side === "manual" && p.manualKey === key) ||
        (side === "excel" && p.excelKey === key)
    );

    if (!pair || !manual || !excel) return "";

    const mVal = manual[pair.manualKey];
    const eVal = excel[pair.excelKey];

    if (mVal === undefined || mVal === null || eVal === undefined || eVal === null) return "";

    const isMatch = String(mVal).trim().toLowerCase() === String(eVal).trim().toLowerCase();

    return isMatch ? "compare-match" : "compare-mismatch";

}

function loadManual(manual, excel) {

    manualBody.innerHTML = "";

    if (!manual) {

        manualBody.innerHTML = `
            <tr>
                <td colspan="2">No Manual Record Found</td>
            </tr>
        `;

        return;
    }

    Object.entries(manual).forEach(([key, value]) => {

        const cls = compareStatusFor(key, "manual", manual, excel);

        manualBody.innerHTML += `

        <tr>

            <td><b>${formatKey(key)}</b></td>

            <td class="${cls}">${value ?? ""}</td>

        </tr>

        `;

    });

}

function loadExcel(excel, manual, duplicateExcelRecords) {

    excelBody.innerHTML = "";

    if (!excel) {

        excelBody.innerHTML = `
            <tr>
                <td colspan="2">No Excel Record Found</td>
            </tr>
        `;

        return;
    }

    Object.entries(excel).forEach(([key, value]) => {

        const cls = compareStatusFor(key, "excel", manual, excel);

        excelBody.innerHTML += `

        <tr>

            <td><b>${formatKey(key)}</b></td>

            <td class="${cls}">${value ?? ""}</td>

        </tr>

        `;

    });

    // Requirement: "If duplicate records exist, display every duplicate
    // Excel record below the main Excel record."
    if (Array.isArray(duplicateExcelRecords) && duplicateExcelRecords.length > 0) {

        duplicateExcelRecords.forEach((dupExcel, index) => {

            excelBody.innerHTML += `
                <tr class="duplicate-divider">
                    <td colspan="2"><b>Duplicate Excel Record #${index + 1}</b></td>
                </tr>
            `;

            Object.entries(dupExcel).forEach(([key, value]) => {

                excelBody.innerHTML += `
                <tr>
                    <td><b>${formatKey(key)}</b></td>
                    <td>${value ?? ""}</td>
                </tr>
                `;

            });

        });

    }

}

function formatKey(key) {

    return key

        .replace(/([A-Z])/g, ' $1')

        .replace(/^./, str => str.toUpperCase());

}

function toggleMenu() {

    document.querySelector(".sidebar")

        .classList.toggle("show");

}