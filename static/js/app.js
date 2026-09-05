// =========================================================
// MEDHISTORY
// Main JavaScript
// =========================================================

let currentDoctorPatientId = null;


// =========================================================
// COMMON HELPERS
// =========================================================

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value ?? "—";
    }
}


function showElement(id) {
    const element = document.getElementById(id);

    if (element) {
        element.classList.remove("hidden");
    }
}


function hideElement(id) {
    const element = document.getElementById(id);

    if (element) {
        element.classList.add("hidden");
    }
}


function requireDoctorPatient() {

    if (!currentDoctorPatientId) {

        alert(
            "Please load a patient profile first."
        );

        return false;
    }

    return true;
}


function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(date) {

    if (!date) {
        return "—";
    }

    return String(date);
}


async function apiJSON(url, options = {}) {

    const response = await fetch(url, options);

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {
            success: false,
            message: "Invalid server response"
        };
    }

    if (!response.ok || !data.success) {

        throw new Error(
            data.message ||
            "Request failed"
        );
    }

    return data;
}


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // -------------------------------------------------
        // OPEN PROFILE
        // -------------------------------------------------

        const openInput =
            document.getElementById(
                "patientId"
            );

        if (openInput) {

            openInput.addEventListener(
                "keydown",
                (event) => {

                    if (event.key === "Enter") {
                        searchPatient();
                    }

                }
            );

        }


        // -------------------------------------------------
        // USER PORTAL
        // -------------------------------------------------

        const userInput =
            document.getElementById(
                "userPatientId"
            );

        if (userInput) {

            userInput.addEventListener(
                "keydown",
                (event) => {

                    if (event.key === "Enter") {
                        loadUserProfile();
                    }

                }
            );

        }


        // -------------------------------------------------
        // DOCTOR PORTAL
        // -------------------------------------------------

        const doctorInput =
            document.getElementById(
                "doctorPatientId"
            );

        if (doctorInput) {

            doctorInput.addEventListener(
                "keydown",
                (event) => {

                    if (event.key === "Enter") {
                        loadDoctorProfile();
                    }

                }
            );

        }


        // -------------------------------------------------
        // UPLOAD BUTTON
        // -------------------------------------------------

        const uploadButton =
            document.querySelector(
                ".upload-button"
            );

        if (uploadButton) {

            uploadButton.addEventListener(
                "click",
                uploadMedicalDocument
            );

        }


        // -------------------------------------------------
        // DOCTOR HISTORY BUTTONS
        // -------------------------------------------------

        setupHistoryButtons();
        setupUserModuleCards();

    }
);


// =========================================================
// OPEN PROFILE
// =========================================================

async function searchPatient() {

    const input =
        document.getElementById(
            "patientId"
        );

    if (!input) {
        return;
    }

    const patientId =
        input.value.trim();

    if (!patientId) {

        alert(
            "Please enter a Patient ID"
        );

        return;
    }

    try {

        const data =
            await apiJSON(
                "/api/patient/" +
                encodeURIComponent(
                    patientId
                )
            );

        const patient =
            data.patient;

        hideElement("notFound");

        const result =
            document.getElementById(
                "patientResult"
            );

        if (result) {

            result.classList.remove(
                "hidden"
            );

            setText(
                "patientName",
                patient.name || "—"
            );

            setText(
                "patientAge",
                "Age: " +
                (patient.age ?? "—")
            );

            setText(
                "bloodGroup",
                patient.blood_group || "—"
            );

            setText(
                "condition",
                patient.condition ||
                "None reported"
            );

            setText(
                "allergy",
                patient.allergy ||
                "None known"
            );

            setText(
                "emergencyContact",
                patient.emergency_contact ||
                "—"
            );

        }

    } catch (error) {

        console.error(
            "Open Profile Error:",
            error
        );

        showElement("notFound");

    }
}


// =========================================================
// USER PORTAL
// =========================================================

async function loadUserProfile() {

    const input =
        document.getElementById(
            "userPatientId"
        );

    if (!input) {
        return;
    }

    const patientId =
        input.value.trim();

    if (!patientId) {

        alert(
            "Please enter a Patient ID"
        );

        return;
    }

    try {

        const data =
            await apiJSON(
                "/api/patient/" +
                encodeURIComponent(
                    patientId
                )
            );

        const patient =
            data.patient;

        hideElement("userNotFound");

        const dashboard =
            document.getElementById(
                "userDashboard"
            );

        if (!dashboard) {
            return;
        }

        dashboard.classList.remove(
            "hidden"
        );

        setText(
            "userName",
            patient.name || "—"
        );

        setText(
            "userBasicInfo",
            "Age: " +
            (patient.age ?? "—") +
            " • Blood Group: " +
            (patient.blood_group || "—")
        );

        setText(
            "infoName",
            patient.name || "—"
        );

        setText(
            "infoAge",
            patient.age ?? "—"
        );

        setText(
            "infoBlood",
            patient.blood_group || "—"
        );

        setText(
            "infoPatientId",
            patientId.toUpperCase()
        );

        setText(
            "userCondition",
            patient.condition ||
            "None reported"
        );

        setText(
            "userAllergy",
            patient.allergy ||
            "None known"
        );


        // -------------------------------------------------
        // USER HISTORY
        // -------------------------------------------------

        window.currentUserPatient = patient;
        renderUserHistory(patient);

    } catch (error) {

        console.error(
            "User Portal Error:",
            error
        );

        showElement("userNotFound");

    }
}


// =========================================================
// DOCTOR PORTAL
// =========================================================

async function loadDoctorProfile() {

    const input =
        document.getElementById(
            "doctorPatientId"
        );

    const dashboard =
        document.getElementById(
            "doctorDashboard"
        );

    const notFound =
        document.getElementById(
            "doctorNotFound"
        );

    if (!input) {

        console.error(
            "doctorPatientId input not found"
        );

        return;
    }

    const patientId =
        input.value.trim();

    if (!patientId) {

        showDoctorError(
            "Please enter a Patient ID",
            "Enter a Patient ID to access the medical record."
        );

        return;
    }

    try {

        const data =
            await apiJSON(
                "/api/patient/" +
                encodeURIComponent(
                    patientId
                )
            );

        const patient =
            data.patient;


        // -------------------------------------------------
        // REMEMBER PATIENT
        // -------------------------------------------------

        currentDoctorPatientId =
            patientId.toUpperCase();


        // -------------------------------------------------
        // HEADER
        // -------------------------------------------------

        setText(
            "doctorPatientName",
            patient.name || "—"
        );

        setText(
            "doctorPatientBasic",
            "Age: " +
            (patient.age ?? "—") +
            " • Blood Group: " +
            (patient.blood_group || "—") +
            " • ID: " +
            currentDoctorPatientId
        );


        // -------------------------------------------------
        // CRITICAL INFORMATION
        // -------------------------------------------------

        setText(
            "doctorBlood",
            patient.blood_group || "—"
        );

        setText(
            "doctorAllergy",
            patient.allergy ||
            "None known"
        );

        setText(
            "doctorCondition",
            patient.condition ||
            "None reported"
        );

        setText(
            "doctorEmergencyContact",
            patient.emergency_contact ||
            "—"
        );


        // -------------------------------------------------
        // SUMMARY
        // -------------------------------------------------

        setText(
            "doctorPatientIdDisplay",
            currentDoctorPatientId
        );

        setText(
            "doctorAge",
            patient.age ?? "—"
        );

        setText(
            "doctorBloodSummary",
            patient.blood_group || "—"
        );

        setText(
            "doctorConditionSummary",
            patient.condition ||
            "None reported"
        );


        // -------------------------------------------------
        // RENDER HISTORY
        // -------------------------------------------------

        renderDoctorHistory(patient);


        // -------------------------------------------------
        // SHOW DASHBOARD
        // -------------------------------------------------

        if (notFound) {

            notFound.classList.add(
                "hidden"
            );

        }

        if (dashboard) {

            dashboard.classList.remove(
                "hidden"
            );

            dashboard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

        console.log(
            "Doctor profile loaded:",
            currentDoctorPatientId
        );

    } catch (error) {

        console.error(
            "Doctor Portal Error:",
            error
        );

        showDoctorError(
            "Unable to access record",
            error.message ||
            "The server could not be reached."
        );

    }
}


// =========================================================
// DOCTOR HISTORY OVERVIEW
// =========================================================

function renderDoctorHistory(patient) {

    const container =
        getOrCreateHistoryContainer();

    if (!container) {
        return;
    }

    const visits =
        Array.isArray(patient.visits)
            ? patient.visits
            : [];

    const medications =
        Array.isArray(patient.medications)
            ? patient.medications
            : [];

    const surgeries =
        Array.isArray(patient.surgeries)
            ? patient.surgeries
            : [];

    const documents =
        Array.isArray(patient.documents)
            ? patient.documents
            : [];

    let html =
        "<div class='history-results-header'>" +
        "<div>" +
        "<p class='eyebrow'>MEDICAL RECORD</p>" +
        "<h3>Patient History Overview</h3>" +
        "</div>" +
        "<button type='button' onclick='closeHistory()'>Close</button>" +
        "</div>";

    html +=
        "<div class='history-list'>";

    html +=
        "<div class='history-item'>" +
        "<strong>Consultations</strong>" +
        "<p>" +
        visits.length +
        " record(s)</p>" +
        "</div>";

    html +=
        "<div class='history-item'>" +
        "<strong>Medications</strong>" +
        "<p>" +
        medications.length +
        " record(s)</p>" +
        "</div>";

    html +=
        "<div class='history-item'>" +
        "<strong>Surgeries</strong>" +
        "<p>" +
        surgeries.length +
        " record(s)</p>" +
        "</div>";

    html +=
        "<div class='history-item'>" +
        "<strong>Medical Documents</strong>" +
        "<p>" +
        documents.length +
        " document(s)</p>" +
        "</div>";

    html +=
        "</div>";

    container.innerHTML =
        html;
}


// =========================================================
// =========================================================
// DOCTOR ERROR
// =========================================================

function showDoctorError(
    title,
    message
) {

    const notFound =
        document.getElementById(
            "doctorNotFound"
        );

    if (!notFound) {

        alert(
            title + "\n\n" + message
        );

        return;
    }

    notFound.classList.remove(
        "hidden"
    );

    const heading =
        notFound.querySelector(
            "h3"
        );

    const paragraph =
        notFound.querySelector(
            "p"
        );

    if (heading) {
        heading.textContent = title;
    }

    if (paragraph) {
        paragraph.textContent = message;
    }
}


// =========================================================
// DOCTOR HISTORY BUTTONS
// =========================================================

function setupHistoryButtons() {

    const cards =
        document.querySelectorAll(
            ".doctor-module-card"
        );

    cards.forEach(
        (card) => {

            const heading =
                card.querySelector(
                    "h4"
                );

            const button =
                card.querySelector(
                    "button"
                );

            if (!heading || !button) {
                return;
            }

            const title =
                heading.textContent
                    .trim()
                    .toLowerCase();

            if (
                title.includes(
                    "surgery"
                )
            ) {

                button.onclick =
                    () => showDoctorHistory(
                        "surgeries"
                    );

            } else if (
                title.includes(
                    "prescription"
                )
            ) {

                button.onclick =
                    () => showDoctorHistory(
                        "medications"
                    );

            } else if (
                title.includes(
                    "visit"
                )
            ) {

                button.onclick =
                    () => showDoctorHistory(
                        "visits"
                    );

            } else if (
                title.includes(
                    "report"
                )
            ) {

                button.onclick =
                    () => showDoctorHistory(
                        "documents"
                    );

            }

        }
    );
}


// =========================================================
// CLOSE DOCTOR HISTORY
// =========================================================

function closeHistory() {

    const container =
        document.getElementById(
            "doctorHistoryResults"
        );

    if (container) {
        container.innerHTML = "";
    }
}


// =========================================================
// =========================================================
// SHOW DOCTOR HISTORY
// =========================================================

function showDoctorHistory(type) {

    if (!requireDoctorPatient()) {
        return;
    }

    const container =
        getOrCreateHistoryContainer();

    if (!container) {
        return;
    }

    const patientId =
        currentDoctorPatientId;

    fetch(
        "/api/patient/" +
        encodeURIComponent(
            patientId
        )
    )
        .then(
            response => response.json()
        )
        .then(
            data => {

                if (
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to load history"
                    );
                }

                renderHistoryType(
                    container,
                    type,
                    data.patient
                );

                container.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }
        )
        .catch(
            error => {

                console.error(
                    "History Error:",
                    error
                );

                container.innerHTML =
                    "<p>Unable to load history.</p>";

            }
        );
}


// =========================================================
// HISTORY CONTAINER
// =========================================================

function getOrCreateHistoryContainer() {

    let container =
        document.getElementById(
            "doctorHistoryResults"
        );

    if (container) {
        return container;
    }

    const dashboard =
        document.getElementById(
            "doctorDashboard"
        );

    if (!dashboard) {
        return null;
    }

    container =
        document.createElement(
            "div"
        );

    container.id =
        "doctorHistoryResults";

    container.className =
        "history-results";

    dashboard.appendChild(
        container
    );

    return container;
}


// =========================================================
// RENDER HISTORY TYPE
// =========================================================

function renderHistoryType(
    container,
    type,
    patient
) {

    let title = "";
    let records = [];

    if (type === "visits") {

        title =
            "Visit History";

        records =
            Array.isArray(
                patient.visits
            )
                ? patient.visits
                : [];

    } else if (
        type === "medications"
    ) {

        title =
            "Prescription / Medication History";

        records =
            Array.isArray(
                patient.medications
            )
                ? patient.medications
                : [];

    } else if (
        type === "surgeries"
    ) {

        title =
            "Surgery History";

        records =
            Array.isArray(
                patient.surgeries
            )
                ? patient.surgeries
                : [];

    } else if (
        type === "documents"
    ) {

        title =
            "Medical Reports";

        records =
            Array.isArray(
                patient.documents
            )
                ? patient.documents
                : [];
    }


    let html =
        "<div class='history-results-header'>" +
        "<h3>" +
        escapeHTML(title) +
        "</h3>" +
        "<button type='button' onclick='closeHistory()'>Close</button>" +
        "</div>";


    if (!records.length) {

        html +=
            "<p>No records available yet.</p>";

        container.innerHTML =
            html;

        return;
    }


    html +=
        "<div class='history-list'>";


    records
        .slice()
        .reverse()
        .forEach(
            (record) => {

                html +=
                    renderHistoryRecord(
                        type,
                        record
                    );

            }
        );


    html +=
        "</div>";

    container.innerHTML =
        html;
}


// =========================================================
// HISTORY RECORD
// =========================================================

function renderHistoryRecord(type, record) {

    if (type === "visits") {
        return `
            <div class="history-item">
                <strong>
                    ${escapeHTML(record.date || "Visit")}
                </strong>

                <p>
                    <b>Doctor:</b>
                    ${escapeHTML(record.doctor || "—")}
                </p>

                <p>
                    <b>Diagnosis:</b>
                    ${escapeHTML(record.diagnosis || "—")}
                </p>

                <p>
                    <b>Treatment:</b>
                    ${escapeHTML(record.treatment || "—")}
                </p>

                <p>
                    <b>Notes:</b>
                    ${escapeHTML(record.notes || "—")}
                </p>
            </div>
        `;
    }

    if (type === "medications") {
        return `
            <div class="history-item">
                <strong>
                    ${escapeHTML(record.name || "Medication")}
                </strong>

                <p>
                    <b>Dosage:</b>
                    ${escapeHTML(record.dosage || "—")}
                </p>

                <p>
                    <b>Frequency:</b>
                    ${escapeHTML(record.frequency || "—")}
                </p>

                <p>
                    <b>Start Date:</b>
                    ${escapeHTML(record.start_date || "—")}
                </p>

                <p>
                    <b>Notes:</b>
                    ${escapeHTML(record.notes || "—")}
                </p>
            </div>
        `;
    }

    if (type === "surgeries") {
        return `
            <div class="history-item">
                <strong>
                    ${escapeHTML(record.name || "Surgery")}
                </strong>

                <p>
                    <b>Date:</b>
                    ${escapeHTML(record.date || "—")}
                </p>

                <p>
                    <b>Hospital:</b>
                    ${escapeHTML(record.hospital || "—")}
                </p>

                <p>
                    <b>Doctor:</b>
                    ${escapeHTML(record.doctor || "—")}
                </p>

                <p>
                    <b>Notes:</b>
                    ${escapeHTML(record.notes || "—")}
                </p>
            </div>
        `;
    }

    if (type === "documents") {
        const url = record.url || "";

        const fileName =
            record.original_name || "Medical Document";

        const extension =
            fileName.split(".").pop().toLowerCase();

        const isImage =
            ["jpg", "jpeg", "png"].includes(extension);

        const isPDF =
            extension === "pdf";

        const icon =
            isPDF
                ? "📄"
                : isImage
                    ? "🖼️"
                    : "📎";

        const preview =
            url && isImage
                ? `
                    <div class="document-preview">
                        <img
                            src="${escapeHTML(url)}"
                            alt="Medical document preview"
                            loading="lazy"
                            class="document-preview-image"
                        >
                    </div>
                `
                : `
                    <div class="document-file-icon">
                        ${icon}
                    </div>
                `;

        const previewButton =
            url
                ? `
                    <button
                        type="button"
                        class="document-action primary document-preview-button"
                        data-document-url="${escapeHTML(url)}"
                        data-document-name="${escapeHTML(fileName)}"
                    >
                        👁 Preview
                    </button>
                `
                : "";

        const openButton =
            url
                ? `
                    <a
                        class="document-action secondary"
                        href="${escapeHTML(url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ↗ Open
                    </a>
                `
                : "";

        return `
            <div class="history-item document-card">

                <div class="document-header">

                    <div class="document-icon">
                        ${icon}
                    </div>

                    <div class="document-title">

                        <strong>
                            ${escapeHTML(
                                record.type ||
                                "Medical Document"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(fileName)}
                        </span>

                    </div>

                </div>

                ${preview}

                <div class="document-details">

                    <div class="document-detail">
                        <span>Date</span>
                        <strong>
                            ${escapeHTML(record.date || "—")}
                        </strong>
                    </div>

                    <div class="document-detail">
                        <span>Uploaded</span>
                        <strong>
                            ${escapeHTML(
                                record.uploaded_at || "—"
                            )}
                        </strong>
                    </div>

                </div>

                ${
                    record.notes
                        ? `
                            <div class="document-notes">
                                <span>Notes</span>
                                <p>
                                    ${escapeHTML(record.notes)}
                                </p>
                            </div>
                        `
                        : ""
                }

                ${
                    url
                        ? `
                            <div class="document-actions">
                                ${previewButton}
                                ${openButton}
                            </div>
                        `
                        : `
                            <div class="document-unavailable">
                                Document file unavailable
                            </div>
                        `
                }

            </div>
        `;
    }

    return "";
}

function hideAddVisitForm() {

    hideElement(
        "addVisitForm"
    );

}


// =========================================================
// SAVE VISIT
// =========================================================

async function saveVisit() {

    if (!requireDoctorPatient()) {
        return;
    }

    const date =
        document.getElementById(
            "visitDate"
        )?.value || "";

    const doctor =
        document.getElementById(
            "visitDoctor"
        )?.value.trim() || "";

    const diagnosis =
        document.getElementById(
            "visitDiagnosis"
        )?.value.trim() || "";

    const treatment =
        document.getElementById(
            "visitTreatment"
        )?.value.trim() || "";

    const notes =
        document.getElementById(
            "visitNotes"
        )?.value.trim() || "";


    if (!doctor) {

        alert(
            "Please enter consulting doctor."
        );

        return;
    }


    if (!diagnosis) {

        alert(
            "Please enter diagnosis."
        );

        return;
    }


    try {

        await apiJSON(
            "/api/patient/" +
            encodeURIComponent(
                currentDoctorPatientId
            ) +
            "/visit",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    date: date,
                    doctor: doctor,
                    diagnosis: diagnosis,
                    treatment: treatment,
                    notes: notes
                })
            }
        );


        alert(
            "Visit saved successfully ✅"
        );


        clearVisitForm();

        hideAddVisitForm();


        // Reload complete patient data
        await loadDoctorProfile();


    } catch (error) {

        console.error(
            "Save Visit Error:",
            error
        );

        alert(
            "Unable to save visit:\n" +
            error.message
        );

    }
}


// =========================================================
// CLEAR VISIT FORM
// =========================================================

function clearVisitForm() {

    const ids = [
        "visitDate",
        "visitDoctor",
        "visitDiagnosis",
        "visitTreatment",
        "visitNotes"
    ];

    ids.forEach(
        (id) => {

            const element =
                document.getElementById(
                    id
                );

            if (element) {
                element.value = "";
            }

        }
    );
}


// =========================================================
// ADD MEDICATION
// =========================================================

async function addMedication() {

    if (!requireDoctorPatient()) {
        return;
    }

    const name =
        prompt(
            "Medication name:"
        );

    if (!name || !name.trim()) {
        return;
    }

    const dosage =
        prompt(
            "Dosage:"
        ) || "";

    const frequency =
        prompt(
            "Frequency:"
        ) || "";

    const startDate =
        prompt(
            "Start date (YYYY-MM-DD):"
        ) || "";

    const notes =
        prompt(
            "Notes:"
        ) || "";


    try {

        await apiJSON(
            "/api/patient/" +
            encodeURIComponent(
                currentDoctorPatientId
            ) +
            "/medication",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    name:
                        name.trim(),

                    dosage:
                        dosage.trim(),

                    frequency:
                        frequency.trim(),

                    start_date:
                        startDate.trim(),

                    notes:
                        notes.trim()
                })
            }
        );


        alert(
            "Medication added successfully ✅"
        );


        await loadDoctorProfile();


    } catch (error) {

        console.error(
            "Medication Error:",
            error
        );

        alert(
            "Unable to save medication:\n" +
            error.message
        );

    }
}


// =========================================================
// ADD SURGERY
// =========================================================

async function addSurgery() {

    if (!requireDoctorPatient()) {
        return;
    }

    const name =
        prompt(
            "Surgery / procedure name:"
        );

    if (!name || !name.trim()) {
        return;
    }

    const date =
        prompt(
            "Date (YYYY-MM-DD):"
        ) || "";

    const hospital =
        prompt(
            "Hospital:"
        ) || "";

    const doctor =
        prompt(
            "Doctor:"
        ) || "";

    const notes =
        prompt(
            "Notes:"
        ) || "";


    try {

        await apiJSON(
            "/api/patient/" +
            encodeURIComponent(
                currentDoctorPatientId
            ) +
            "/surgery",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    name:
                        name.trim(),

                    date:
                        date.trim(),

                    hospital:
                        hospital.trim(),

                    doctor:
                        doctor.trim(),

                    notes:
                        notes.trim()
                })
            }
        );


        alert(
            "Surgery added successfully ✅"
        );


        await loadDoctorProfile();


    } catch (error) {

        console.error(
            "Surgery Error:",
            error
        );

        alert(
            "Unable to save surgery:\n" +
            error.message
        );

    }
}


// =========================================================
// UPDATE ALLERGY
// =========================================================

async function updateAllergy() {

    if (!requireDoctorPatient()) {
        return;
    }

    const allergy =
        prompt(
            "Allergy:"
        );

    if (!allergy || !allergy.trim()) {
        return;
    }

    const reaction =
        prompt(
            "Reaction:"
        ) || "";

    const notes =
        prompt(
            "Notes:"
        ) || "";


    try {

        await apiJSON(
            "/api/patient/" +
            encodeURIComponent(
                currentDoctorPatientId
            ) +
            "/allergy",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    allergy:
                        allergy.trim(),

                    reaction:
                        reaction.trim(),

                    notes:
                        notes.trim()
                })
            }
        );


        alert(
            "Allergy updated successfully ✅"
        );


        await loadDoctorProfile();


    } catch (error) {

        console.error(
            "Allergy Error:",
            error
        );

        alert(
            "Unable to update allergy:\n" +
            error.message
        );

    }
}


// =========================================================
// DOCUMENT UPLOAD
// =========================================================

async function uploadMedicalDocument() {

    if (!requireDoctorPatient()) {
        return;
    }

    const fileInput =
        document.getElementById(
            "medicalFile"
        );

    const typeInput =
        document.getElementById(
            "documentType"
        );

    const dateInput =
        document.getElementById(
            "documentDate"
        );

    const notesInput =
        document.getElementById(
            "documentNotes"
        );


    if (!fileInput) {

        alert(
            "Medical file input not found."
        );

        return;
    }


    const file =
        fileInput.files[0];


    if (!file) {

        alert(
            "Please select a medical document."
        );

        return;
    }


    const formData =
        new FormData();


    formData.append(
        "medical_file",
        file
    );


    formData.append(
        "document_type",
        typeInput?.value || "other"
    );


    formData.append(
        "document_date",
        dateInput?.value || ""
    );


    formData.append(
        "notes",
        notesInput?.value || ""
    );


    try {

        const data =
            await apiJSON(
                "/api/patient/" +
                encodeURIComponent(
                    currentDoctorPatientId
                ) +
                "/document",
                {
                    method: "POST",
                    body: formData
                }
            );


        alert(
            "Medical document uploaded successfully ✅"
        );


        fileInput.value = "";

        if (typeInput) {
            typeInput.value = "";
        }

        if (dateInput) {
            dateInput.value = "";
        }

        if (notesInput) {
            notesInput.value = "";
        }


        await loadDoctorProfile();


    } catch (error) {

        console.error(
            "Upload Error:",
            error
        );

        alert(
            "Unable to upload document:\n" +
            error.message
        );

    }
}


// =========================================================
// USER HISTORY
// =========================================================

function renderUserHistory(patient) {

    const dashboard =
        document.getElementById(
            "userDashboard"
        );

    if (!dashboard) {
        return;
    }


    let container =
        document.getElementById(
            "userHistoryResults"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "userHistoryResults";

        container.className =
            "history-results";


        const emergency =
            dashboard.querySelector(
                ".emergency-notice"
            );


        if (emergency) {

            dashboard.insertBefore(
                container,
                emergency
            );

        } else {

            dashboard.appendChild(
                container
            );

        }

    }


    const visits =
        Array.isArray(
            patient.visits
        )
            ? patient.visits
            : [];


    const medications =
        Array.isArray(
            patient.medications
        )
            ? patient.medications
            : [];


    const surgeries =
        Array.isArray(
            patient.surgeries
        )
            ? patient.surgeries
            : [];


    const documents =
        Array.isArray(
            patient.documents
        )
            ? patient.documents
            : [];


    let html =
        "<div class='section-title'>" +
        "<div>" +
        "<p class='eyebrow'>RECORDS</p>" +
        "<h3>Medical Record History</h3>" +
        "</div>" +
        "<span class='section-symbol'>📋</span>" +
        "</div>";


    html +=
        "<div class='history-list'>";


    html +=
        "<div class='history-item'>" +
        "<strong>Visits</strong>" +
        "<p>" +
        visits.length +
        " record(s)</p>" +
        "</div>";


    html +=
        "<div class='history-item'>" +
        "<strong>Medications</strong>" +
        "<p>" +
        medications.length +
        " record(s)</p>" +
        "</div>";


    html +=
        "<div class='history-item'>" +
        "<strong>Surgeries</strong>" +
        "<p>" +
        surgeries.length +
        " record(s)</p>" +
        "</div>";


    html +=
        "<div class='history-item'>" +
        "<strong>Medical Documents</strong>" +
        "<p>" +
        documents.length +
        " document(s)</p>" +
        "</div>";


    html +=
        "</div>";


    // Latest visits

    if (visits.length) {

        html +=
            "<h4>Recent Visits</h4>";

        visits
            .slice()
            .reverse()
            .forEach(
                visit => {

                    html +=
                        renderHistoryRecord(
                            "visits",
                            visit
                        );

                }
            );

    }


    // Current medications

    if (medications.length) {

        html +=
            "<h4>Medications</h4>";

        medications
            .slice()
            .reverse()
            .forEach(
                medication => {

                    html +=
                        renderHistoryRecord(
                            "medications",
                            medication
                        );

                }
            );

    }


    // Surgeries

    if (surgeries.length) {

        html +=
            "<h4>Surgeries</h4>";

        surgeries
            .slice()
            .reverse()
            .forEach(
                surgery => {

                    html +=
                        renderHistoryRecord(
                            "surgeries",
                            surgery
                        );

                }
            );

    }


    // Documents

    if (documents.length) {

        html +=
            "<h4>Documents</h4>";

        documents
            .slice()
            .reverse()
            .forEach(
                document => {

                    html +=
                        renderHistoryRecord(
                            "documents",
                            document
                        );

                }
            );

    }


    container.innerHTML =
        html;
}

/* =========================================================
   USER MODULE CARDS
   ========================================================= */

function setupUserModuleCards() {

    const cards =
        document.querySelectorAll(
            ".module-card"
        );

    cards.forEach(
        (card) => {

            const heading =
                card.querySelector("h4");

            if (!heading) {
                return;
            }

            const title =
                heading.textContent
                    .trim()
                    .toLowerCase();

            card.style.cursor = "pointer";

            card.addEventListener(
                "click",
                () => {

                    const patient =
                        window.currentUserPatient;

                    if (!patient) {
                        alert(
                            "Please load your Patient Profile first."
                        );
                        return;
                    }

                    if (title === "medications") {
                        showUserModule(
                            "medications",
                            patient
                        );

                    } else if (
                        title === "surgeries"
                    ) {
                        showUserModule(
                            "surgeries",
                            patient
                        );

                    } else if (
                        title === "consultations"
                    ) {
                        showUserModule(
                            "visits",
                            patient
                        );

                    } else if (
                        title.includes("reports")
                    ) {
                        showUserModule(
                            "documents",
                            patient
                        );

                    } else if (
                        title === "family history"
                    ) {
                        showUserFamilyHistory(
                            patient
                        );

                    } else if (
                        title === "medical timeline"
                    ) {
                        showUserTimeline(
                            patient
                        );
                    }

                }
            );

        }
    );

}


/* =========================================================
   USER MODULE DISPLAY
   ========================================================= */

function showUserModule(
    type,
    patient
) {

    const dashboard =
        document.getElementById(
            "userDashboard"
        );

    if (!dashboard) {
        return;
    }

    let container =
        document.getElementById(
            "userModuleResults"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "userModuleResults";

        container.className =
            "history-results";

        const emergency =
            dashboard.querySelector(
                ".emergency-notice"
            );

        if (emergency) {
            dashboard.insertBefore(
                container,
                emergency
            );
        } else {
            dashboard.appendChild(
                container
            );
        }
    }

    let records = [];
    let title = "";

    if (type === "medications") {

        records =
            Array.isArray(
                patient.medications
            )
                ? patient.medications
                : [];

        title = "Medications";

    } else if (type === "surgeries") {

        records =
            Array.isArray(
                patient.surgeries
            )
                ? patient.surgeries
                : [];

        title = "Surgeries";

    } else if (type === "visits") {

        records =
            Array.isArray(
                patient.visits
            )
                ? patient.visits
                : [];

        title = "Consultations";

    } else if (type === "documents") {

        records =
            Array.isArray(
                patient.documents
            )
                ? patient.documents
                : [];

        title =
            "Reports & Prescriptions";
    }

    let html =
        `
        <div class="section-title">
            <div>
                <p class="eyebrow">PATIENT RECORD</p>
                <h3>${escapeHTML(title)}</h3>
            </div>

            <button
                type="button"
                onclick="closeUserModule()"
            >
                Close
            </button>
        </div>
        `;

    if (!records.length) {

        html +=
            `
            <div class="history-item">
                <strong>No records available</strong>
                <p>
                    No ${escapeHTML(
                        title.toLowerCase()
                    )} have been added yet.
                </p>
            </div>
            `;

    } else {

        html +=
            "<div class='history-list'>";

        records
            .slice()
            .reverse()
            .forEach(
                (record) => {

                    html +=
                        renderHistoryRecord(
                            type,
                            record
                        );

                }
            );

        html +=
            "</div>";
    }

    container.innerHTML =
        html;

    container.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================================
   FAMILY HISTORY
   ========================================================= */

function showUserFamilyHistory(
    patient
) {

    const dashboard =
        document.getElementById(
            "userDashboard"
        );

    if (!dashboard) {
        return;
    }

    let container =
        document.getElementById(
            "userModuleResults"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "userModuleResults";

        container.className =
            "history-results";

        dashboard.appendChild(
            container
        );
    }

    const family =
        patient.family_history ||
        patient.familyHistory ||
        patient.family ||
        [];

    let html =
        `
        <div class="section-title">
            <div>
                <p class="eyebrow">PATIENT RECORD</p>
                <h3>Family History</h3>
            </div>

            <button
                type="button"
                onclick="closeUserModule()"
            >
                Close
            </button>
        </div>
        `;

    if (
        !Array.isArray(family) ||
        !family.length
    ) {

        html +=
            `
            <div class="history-item">
                <strong>Family history not available</strong>
                <p>
                    No family medical history has been recorded.
                </p>
            </div>
            `;

    } else {

        html +=
            "<div class='history-list'>";

        family.forEach(
            (member) => {

                html +=
                    `
                    <div class="history-item">

                        <strong>
                            ${escapeHTML(
                                member.relation ||
                                "Family Member"
                            )}
                        </strong>

                        <p>
                            <b>Condition:</b>
                            ${escapeHTML(
                                member.condition ||
                                "—"
                            )}
                        </p>

                        <p>
                            <b>Notes:</b>
                            ${escapeHTML(
                                member.notes ||
                                "—"
                            )}
                        </p>

                    </div>
                    `;

            }
        );

        html +=
            "</div>";
    }

    container.innerHTML =
        html;

    container.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================================
   MEDICAL TIMELINE
   ========================================================= */

function showUserTimeline(
    patient
) {

    const dashboard =
        document.getElementById(
            "userDashboard"
        );

    if (!dashboard) {
        return;
    }

    let container =
        document.getElementById(
            "userModuleResults"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "userModuleResults";

        container.className =
            "history-results";

        dashboard.appendChild(
            container
        );
    }

    const timeline = [];

    (Array.isArray(patient.visits)
        ? patient.visits
        : []
    ).forEach(
        (item) => {

            timeline.push({
                date: item.date || "",
                type: "Consultation",
                data: item
            });

        }
    );

    (Array.isArray(patient.surgeries)
        ? patient.surgeries
        : []
    ).forEach(
        (item) => {

            timeline.push({
                date: item.date || "",
                type: "Surgery",
                data: item
            });

        }
    );

    (Array.isArray(patient.documents)
        ? patient.documents
        : []
    ).forEach(
        (item) => {

            timeline.push({
                date: item.date || "",
                type: "Medical Document",
                data: item
            });

        }
    );

    timeline.sort(
        (a, b) =>
            String(b.date).localeCompare(
                String(a.date)
            )
    );

    let html =
        `
        <div class="section-title">
            <div>
                <p class="eyebrow">PATIENT RECORD</p>
                <h3>Medical Timeline</h3>
            </div>

            <button
                type="button"
                onclick="closeUserModule()"
            >
                Close
            </button>
        </div>

        <div class="history-list">
        `;

    if (!timeline.length) {

        html +=
            `
            <div class="history-item">
                <strong>No timeline records</strong>
                <p>No medical events have been recorded yet.</p>
            </div>
            `;

    } else {

        timeline.forEach(
            (event) => {

                html +=
                    `
                    <div class="history-item">

                        <strong>
                            ${escapeHTML(
                                event.type
                            )}
                        </strong>

                        <p>
                            <b>Date:</b>
                            ${escapeHTML(
                                event.date ||
                                "—"
                            )}
                        </p>
                    `;

                if (
                    event.type ===
                    "Consultation"
                ) {

                    html +=
                        `
                        <p>
                            <b>Doctor:</b>
                            ${escapeHTML(
                                event.data.doctor ||
                                "—"
                            )}
                        </p>

                        <p>
                            <b>Diagnosis:</b>
                            ${escapeHTML(
                                event.data.diagnosis ||
                                "—"
                            )}
                        </p>
                        `;

                } else if (
                    event.type === "Surgery"
                ) {

                    html +=
                        `
                        <p>
                            <b>Surgery:</b>
                            ${escapeHTML(
                                event.data.name ||
                                "—"
                            )}
                        </p>
                        `;

                } else if (
                    event.type ===
                    "Medical Document"
                ) {

                    html +=
                        `
                        <p>
                            <b>Document:</b>
                            ${escapeHTML(
                                event.data.original_name ||
                                "Medical Document"
                            )}
                        </p>
                        `;

                }

                html +=
                    "</div>";

            }
        );
    }

    html +=
        "</div>";

    container.innerHTML =
        html;

    container.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================================
   CLOSE USER MODULE
   ========================================================= */

function closeUserModule() {

    const container =
        document.getElementById(
            "userModuleResults"
        );

    if (container) {
        container.innerHTML = "";
    }
}



/* =========================================================
   EMERGENCY SUMMARY
========================================================= */

async function showEmergencySummary() {

    const input =
        document.getElementById(
            "emergencyPatientId"
        );

    if (!input) {
        console.error(
            "emergencyPatientId input not found"
        );
        return;
    }

    const patientId =
        input.value.trim();

    if (!patientId) {
        alert(
            "Please enter a Patient ID"
        );
        return;
    }

    try {

        const data =
            await apiJSON(
                "/api/patient/" +
                encodeURIComponent(
                    patientId
                )
            );

        const patient =
            data.patient;

        const visits =
            Array.isArray(patient.visits)
                ? patient.visits
                : [];

        const medications =
            Array.isArray(patient.medications)
                ? patient.medications
                : [];

        const surgeries =
            Array.isArray(patient.surgeries)
                ? patient.surgeries
                : [];

        /* -----------------------------------------
           LATEST RECORDS
        ----------------------------------------- */

        const latestVisit =
            visits.length
                ? visits[visits.length - 1]
                : null;

        const latestMedication =
            medications.length
                ? medications[
                    medications.length - 1
                ]
                : null;

        /* -----------------------------------------
           SAFE VALUES
        ----------------------------------------- */

        const allergy =
            patient.allergy ||
            "None reported";

        const condition =
            patient.condition ||
            "No condition reported";

        const surgeryText =
            surgeries.length
                ? surgeries
                    .map(
                        surgery =>
                            (surgery.name ||
                                "Surgical procedure") +
                            (
                                surgery.date
                                    ? " — " +
                                      surgery.date
                                    : ""
                            )
                    )
                    .join("<br>")
                : "No surgery recorded";

        const prescriptionText =
            latestMedication
                ? (
                    latestMedication.name ||
                    "Medication recorded"
                ) +
                (
                    latestMedication.dosage
                        ? " — " +
                          latestMedication.dosage
                        : ""
                ) +
                (
                    latestMedication.frequency
                        ? " (" +
                          latestMedication.frequency +
                          ")"
                        : ""
                )
                : "No prescription recorded";

        const visitText =
            latestVisit
                ? (
                    latestVisit.diagnosis ||
                    latestVisit.treatment ||
                    "Recent visit recorded"
                )
                : "No recent visit recorded";

        /* -----------------------------------------
           SUMMARY HTML
        ----------------------------------------- */

        const html = `

            <section
                id="emergencySummaryResult"
                class="dashboard-section"
            >

                <div class="section-title">

                    <div>

                        <p class="eyebrow">
                            EMERGENCY ACCESS
                        </p>

                        <h3>
                            🚨 Emergency Medical Summary
                        </h3>

                        <p>
                            Quick-glance patient information
                            for emergency reference.
                        </p>

                    </div>

                    <span class="section-symbol">
                        🩺
                    </span>

                </div>


                <div class="critical-grid">

                    <div class="info-item">
                        <span>👤 Name</span>
                        <strong>
                            ${escapeHTML(
                                patient.name ||
                                "—"
                            )}
                        </strong>
                    </div>


                    <div class="info-item">
                        <span>🆔 Patient ID</span>
                        <strong>
                            ${escapeHTML(
                                patient.id ||
                                patient.patient_id ||
                                patientId.toUpperCase()
                            )}
                        </strong>
                    </div>


                    <div class="info-item">
                        <span>🩸 Blood Group</span>
                        <strong>
                            ${escapeHTML(
                                patient.blood_group ||
                                "—"
                            )}
                        </strong>
                    </div>


                    <div class="info-item">
                        <span>🦠 Medical Condition</span>
                        <strong>
                            ${escapeHTML(
                                condition
                            )}
                        </strong>
                    </div>


                    <div class="info-item">
                        <span>⚠️ Allergy</span>
                        <strong>
                            ${escapeHTML(
                                allergy
                            )}
                        </strong>
                    </div>


                    <div class="info-item">
                        <span>🏥 Surgery</span>
                        <strong>
                            ${surgeryText}
                        </strong>
                    </div>


                    <div class="info-item">
                        <span>💊 Last Prescription</span>
                        <strong>
                            ${escapeHTML(
                                prescriptionText
                            )}
                        </strong>
                    </div>


                    <div class="info-item">
                        <span>📋 Last Medical Visit</span>
                        <strong>
                            ${escapeHTML(
                                visitText
                            )}
                        </strong>
                    </div>

                </div>


                <div class="search-row">

                    <button
                        type="button"
                        onclick="closeEmergencySummary()"
                    >
                        Close Summary
                    </button>

                </div>

            </section>
        `;

        const existing =
            document.getElementById(
                "emergencySummaryResult"
            );

        if (existing) {
            existing.outerHTML = html;
        } else {

            const entry =
                document.getElementById(
                    "emergencySummaryEntry"
                );

            if (entry) {
                entry.insertAdjacentHTML(
                    "afterend",
                    html
                );
            }
        }

        const result =
            document.getElementById(
                "emergencySummaryResult"
            );

        if (result) {
            result.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }

    } catch (error) {

        console.error(
            "Emergency Summary Error:",
            error
        );

        alert(
            "Unable to generate summary:\n" +
            error.message
        );
    }
}


/* =========================================================
   CLOSE EMERGENCY SUMMARY
========================================================= */

function closeEmergencySummary() {

    const result =
        document.getElementById(
            "emergencySummaryResult"
        );

    if (result) {
        result.remove();
    }
}
