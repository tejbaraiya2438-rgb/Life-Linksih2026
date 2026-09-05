from flask import Flask, render_template, jsonify, request, send_from_directory
import json
import os
import uuid
from datetime import datetime

app = Flask(__name__)

DATA_FILE = os.path.join("data", "patients.json")
UPLOAD_FOLDER = os.path.join("static", "uploads")

os.makedirs("data", exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================================
# DATA HELPERS
# =========================================================

def load_patients():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_patients(patients):
    temp_file = DATA_FILE + ".tmp"

    with open(temp_file, "w", encoding="utf-8") as file:
        json.dump(
            patients,
            file,
            indent=4,
            ensure_ascii=False
        )

    os.replace(temp_file, DATA_FILE)


def get_actual_patient_id(patients, patient_id):
    if not isinstance(patients, dict):
        return None

    for key in patients:
        if str(key).lower() == str(patient_id).lower():
            return key

    return None


def find_patient(patient_id):
    patients = load_patients()

    if isinstance(patients, dict):

        actual_id = get_actual_patient_id(
            patients,
            patient_id
        )

        if actual_id is not None:
            return patients[actual_id]

    elif isinstance(patients, list):

        for patient in patients:

            current_id = str(
                patient.get("patient_id", "")
            )

            if current_id.lower() == str(
                patient_id
            ).lower():
                return patient

    return None


def ensure_patient_arrays(patient):
    if "visits" not in patient:
        patient["visits"] = []

    if "medications" not in patient:
        patient["medications"] = []

    if "surgeries" not in patient:
        patient["surgeries"] = []

    if "allergy_history" not in patient:
        patient["allergy_history"] = []

    if "documents" not in patient:
        patient["documents"] = []


def get_patient_for_update(patient_id):
    patients = load_patients()

    actual_id = get_actual_patient_id(
        patients,
        patient_id
    )

    if actual_id is None:
        return None, None, None

    patient = patients[actual_id]

    ensure_patient_arrays(patient)

    return patients, actual_id, patient


# =========================================================
# PAGES
# =========================================================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/open")
def open_profile():
    return render_template("open.html")


@app.route("/user")
def user_portal():
    return render_template("user.html")


@app.route("/doctor")
def doctor_portal():
    return render_template("doctor.html")


# =========================================================
# GET PATIENT
# =========================================================

@app.route("/api/patient/<patient_id>")
def get_patient(patient_id):

    patient = find_patient(patient_id)

    if patient is None:

        return jsonify({
            "success": False,
            "message": "Patient not found"
        }), 404

    ensure_patient_arrays(patient)

    return jsonify({
        "success": True,
        "patient": patient
    })


# =========================================================
# ADD VISIT
# =========================================================

@app.route(
    "/api/patient/<patient_id>/visit",
    methods=["POST"]
)
def add_visit(patient_id):

    patients, actual_id, patient = \
        get_patient_for_update(patient_id)

    if patient is None:

        return jsonify({
            "success": False,
            "message": "Patient not found"
        }), 404

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "No visit data received"
        }), 400

    date = str(
        data.get("date", "")
    ).strip()

    doctor = str(
        data.get("doctor", "")
    ).strip()

    diagnosis = str(
        data.get("diagnosis", "")
    ).strip()

    treatment = str(
        data.get("treatment", "")
    ).strip()

    notes = str(
        data.get("notes", "")
    ).strip()

    if not doctor or not diagnosis:

        return jsonify({
            "success": False,
            "message": "Doctor and diagnosis are required"
        }), 400

    if not date:
        date = datetime.now().strftime(
            "%Y-%m-%d"
        )

    new_visit = {
        "date": date,
        "doctor": doctor,
        "diagnosis": diagnosis,
        "treatment": treatment,
        "notes": notes
    }

    patient["visits"].append(new_visit)

    save_patients(patients)

    return jsonify({
        "success": True,
        "message": "Visit added successfully",
        "visit": new_visit,
        "patient": patient
    })


# =========================================================
# ADD MEDICATION
# =========================================================

@app.route(
    "/api/patient/<patient_id>/medication",
    methods=["POST"]
)
def add_medication(patient_id):

    patients, actual_id, patient = \
        get_patient_for_update(patient_id)

    if patient is None:

        return jsonify({
            "success": False,
            "message": "Patient not found"
        }), 404

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "No medication data received"
        }), 400

    name = str(
        data.get("name", "")
    ).strip()

    dosage = str(
        data.get("dosage", "")
    ).strip()

    frequency = str(
        data.get("frequency", "")
    ).strip()

    start_date = str(
        data.get("start_date", "")
    ).strip()

    notes = str(
        data.get("notes", "")
    ).strip()

    if not name:

        return jsonify({
            "success": False,
            "message": "Medication name is required"
        }), 400

    medication = {
        "id": uuid.uuid4().hex,
        "name": name,
        "dosage": dosage,
        "frequency": frequency,
        "start_date": start_date,
        "notes": notes,
        "added_at": datetime.now().isoformat(
            timespec="seconds"
        )
    }

    patient["medications"].append(
        medication
    )

    save_patients(patients)

    return jsonify({
        "success": True,
        "message": "Medication added successfully",
        "medication": medication,
        "patient": patient
    })


# =========================================================
# ADD SURGERY
# =========================================================

@app.route(
    "/api/patient/<patient_id>/surgery",
    methods=["POST"]
)
def add_surgery(patient_id):

    patients, actual_id, patient = \
        get_patient_for_update(patient_id)

    if patient is None:

        return jsonify({
            "success": False,
            "message": "Patient not found"
        }), 404

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "No surgery data received"
        }), 400

    name = str(
        data.get("name", "")
    ).strip()

    date = str(
        data.get("date", "")
    ).strip()

    hospital = str(
        data.get("hospital", "")
    ).strip()

    doctor = str(
        data.get("doctor", "")
    ).strip()

    notes = str(
        data.get("notes", "")
    ).strip()

    if not name:

        return jsonify({
            "success": False,
            "message": "Surgery/procedure name is required"
        }), 400

    if not date:
        date = datetime.now().strftime(
            "%Y-%m-%d"
        )

    surgery = {
        "id": uuid.uuid4().hex,
        "name": name,
        "date": date,
        "hospital": hospital,
        "doctor": doctor,
        "notes": notes
    }

    patient["surgeries"].append(
        surgery
    )

    save_patients(patients)

    return jsonify({
        "success": True,
        "message": "Surgery added successfully",
        "surgery": surgery,
        "patient": patient
    })


# =========================================================
# UPDATE ALLERGY
# =========================================================

@app.route(
    "/api/patient/<patient_id>/allergy",
    methods=["POST"]
)
def update_allergy(patient_id):

    patients, actual_id, patient = \
        get_patient_for_update(patient_id)

    if patient is None:

        return jsonify({
            "success": False,
            "message": "Patient not found"
        }), 404

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "No allergy data received"
        }), 400

    allergy = str(
        data.get("allergy", "")
    ).strip()

    reaction = str(
        data.get("reaction", "")
    ).strip()

    notes = str(
        data.get("notes", "")
    ).strip()

    if not allergy:

        return jsonify({
            "success": False,
            "message": "Allergy is required"
        }), 400

    # Update current allergy
    patient["allergy"] = allergy

    allergy_record = {
        "id": uuid.uuid4().hex,
        "allergy": allergy,
        "reaction": reaction,
        "notes": notes,
        "date": datetime.now().strftime(
            "%Y-%m-%d"
        )
    }

    patient["allergy_history"].append(
        allergy_record
    )

    save_patients(patients)

    return jsonify({
        "success": True,
        "message": "Allergy updated successfully",
        "allergy_record": allergy_record,
        "patient": patient
    })


# =========================================================
# UPLOAD MEDICAL DOCUMENT
# =========================================================

@app.route(
    "/api/patient/<patient_id>/document",
    methods=["POST"]
)
def upload_document(patient_id):

    patients, actual_id, patient = \
        get_patient_for_update(patient_id)

    if patient is None:

        return jsonify({
            "success": False,
            "message": "Patient not found"
        }), 404

    medical_file = request.files.get(
        "medical_file"
    )

    if not medical_file:

        return jsonify({
            "success": False,
            "message": "No medical file received"
        }), 400

    if not medical_file.filename:

        return jsonify({
            "success": False,
            "message": "Invalid file name"
        }), 400

    document_type = request.form.get(
        "document_type",
        "other"
    ).strip()

    document_date = request.form.get(
        "document_date",
        ""
    ).strip()

    notes = request.form.get(
        "notes",
        ""
    ).strip()

    original_name = medical_file.filename

    extension = os.path.splitext(
        original_name
    )[1].lower()

    allowed_extensions = {
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png"
    }

    if extension not in allowed_extensions:

        return jsonify({
            "success": False,
            "message": "Unsupported file type"
        }), 400

    unique_name = (
        uuid.uuid4().hex +
        extension
    )

    save_path = os.path.join(
        UPLOAD_FOLDER,
        unique_name
    )

    medical_file.save(save_path)

    document = {
        "id": uuid.uuid4().hex,
        "type": document_type,
        "date": document_date,
        "notes": notes,
        "original_name": original_name,
        "file_name": unique_name,
        "uploaded_at": datetime.now().isoformat(
            timespec="seconds"
        ),
        "url": "/static/uploads/" + unique_name
    }

    patient["documents"].append(
        document
    )

    save_patients(patients)

    return jsonify({
        "success": True,
        "message": "Medical document uploaded successfully",
        "document": document,
        "patient": patient
    })


# =========================================================
# SERVE UPLOADED DOCUMENTS
# =========================================================

@app.route("/uploads/<filename>")
def uploaded_file(filename):

    return send_from_directory(
        UPLOAD_FOLDER,
        filename
    )


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )
