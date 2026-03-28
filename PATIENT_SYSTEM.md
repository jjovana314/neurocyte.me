# Patient Data Management System

## Overview
This system allows doctors to create and manage patient records with medical history and family history tracking. Patient records are privacy-protected and do **not store patient names**.

## Key Features

### 1. **Patient Records**
- **No Personal Identifiers**: Patient names are **not stored** for privacy protection
- **Doctor Ownership**: Each patient record is created and owned by a specific doctor
- **Auto-Generated ID**: Each patient gets a unique database-generated ID
- **Timestamped**: Records include creation and last update timestamps
- **Notes Field**: Doctors can add general notes about the patient

### 2. **Medical History Tracking**
Separate table storing patient's previous disorders including:
- **Disorder Name**: Type of condition (e.g., Diabetes, Hypertension, Migraine)
- **Description**: Detailed description of the disorder
- **Diagnosis Date**: When the disorder was diagnosed
- **Severity**: mild, moderate, or severe
- **Medications**: Current or past medications for this condition
- **Recorded Date**: When this history entry was added

### 3. **Family History Tracking**
Separate table for hereditary and neurological diseases including:
- **Disease Type**: Neurological or hereditary diseases (e.g., Alzheimer's, Parkinson's, Huntington's)
- **Relation**: Family member relationship (Mother, Father, Sibling, Grandparent, etc.)
- **Severity**: How severe the disease is in the family member
- **Notes**: Additional information about the disease in the family

## Authorization & Permissions

- ✅ Only **doctors** with appropriate role can create patient records
- ✅ Doctors can **only access** their own created patient records
- ✅ Doctors can **only modify/delete** their own patient records
- ✅ **JWT Authentication** required for all endpoints

## API Endpoints

### Patient Management

#### Create Patient Record
```
POST /patients
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "notes": "Optional initial notes about the patient"
}

Response (201):
{
  "id": 1,
  "doctorId": 5,
  "notes": "Optional initial notes",
  "createdAt": "2024-03-28T10:30:00Z",
  "updatedAt": "2024-03-28T10:30:00Z"
}
```

#### Get All My Patients
```
GET /patients/my-patients
Authorization: Bearer <jwt_token>

Response (200):
[
  {
    "id": 1,
    "doctorId": 5,
    "notes": "Patient notes",
    "createdAt": "2024-03-28T10:30:00Z",
    "updatedAt": "2024-03-28T10:30:00Z",
    "medicalHistory": [...],
    "familyHistory": [...]
  }
]
```

#### Get Specific Patient
```
GET /patients/:patientId
Authorization: Bearer <jwt_token>

Response (200):
{
  "id": 1,
  "doctorId": 5,
  "notes": "Patient notes",
  "createdAt": "2024-03-28T10:30:00Z",
  "updatedAt": "2024-03-28T10:30:00Z",
  "medicalHistory": [...],
  "familyHistory": [...]
}
```

#### Update Patient Notes
```
PUT /patients/:patientId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "notes": "Updated patient notes"
}

Response (200):
{
  "id": 1,
  "doctorId": 5,
  "notes": "Updated patient notes",
  "updatedAt": "2024-03-28T10:45:00Z"
}
```

#### Delete Patient Record
```
DELETE /patients/:patientId
Authorization: Bearer <jwt_token>

Response (204 No Content)
```

### Medical History Management

#### Add Patient Medical History
```
POST /patients/:patientId/history
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "disorder": "Diabetes Type 2",
  "description": "Type 2 diabetes diagnosed in 2019",
  "diagnosisDate": "2019-05-15",
  "severity": "moderate",
  "medications": "Metformin 500mg twice daily"
}

Response (201):
{
  "id": 1,
  "patientId": 1,
  "disorder": "Diabetes Type 2",
  "description": "Type 2 diabetes diagnosed in 2019",
  "diagnosisDate": "2019-05-15",
  "severity": "moderate",
  "medications": "Metformin 500mg twice daily",
  "recordedAt": "2024-03-28T10:30:00Z"
}
```

#### Get Patient Medical History
```
GET /patients/:patientId/history
Authorization: Bearer <jwt_token>

Response (200):
[
  {
    "id": 1,
    "patientId": 1,
    "disorder": "Diabetes Type 2",
    "description": "Type 2 diabetes diagnosed in 2019",
    "diagnosisDate": "2019-05-15",
    "severity": "moderate",
    "medications": "Metformin 500mg twice daily",
    "recordedAt": "2024-03-28T10:30:00Z"
  }
]
```

### Family History Management

#### Add Patient Family History
```
POST /patients/:patientId/family-history
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "diseaseType": "Alzheimer's Disease",
  "relation": "Mother",
  "severity": "severe",
  "notes": "Mother diagnosed at age 65, progressed rapidly"
}

Response (201):
{
  "id": 1,
  "patientId": 1,
  "diseaseType": "Alzheimer's Disease",
  "relation": "Mother",
  "severity": "severe",
  "notes": "Mother diagnosed at age 65, progressed rapidly",
  "recordedAt": "2024-03-28T10:30:00Z"
}
```

#### Get Patient Family History
```
GET /patients/:patientId/family-history
Authorization: Bearer <jwt_token>

Response (200):
[
  {
    "id": 1,
    "patientId": 1,
    "diseaseType": "Alzheimer's Disease",
    "relation": "Mother",
    "severity": "severe",
    "notes": "Mother diagnosed at age 65, progressed rapidly",
    "recordedAt": "2024-03-28T10:30:00Z"
  },
  {
    "id": 2,
    "patientId": 1,
    "diseaseType": "Parkinson's Disease",
    "relation": "Father",
    "severity": "moderate",
    "notes": "Father diagnosed at age 72",
    "recordedAt": "2024-03-28T10:35:00Z"
  }
]
```

## Database Schema

### Patient Table
```
- id (PrimaryKey, Auto-increment)
- doctorId (ForeignKey -> User)
- notes (Text, nullable)
- createdAt (Timestamp)
- updatedAt (Timestamp)
- medicalHistory (Relation -> PatientHistory[])
- familyHistory (Relation -> FamilyHistory[])
```

### PatientHistory Table
```
- id (PrimaryKey, Auto-increment)
- patientId (ForeignKey -> Patient, CASCADE DELETE)
- disorder (String)
- description (Text, nullable)
- diagnosisDate (String, nullable)
- severity (String, can be: mild, moderate, severe)
- medications (String, nullable)
- recordedAt (Timestamp)
```

### FamilyHistory Table
```
- id (PrimaryKey, Auto-increment)
- patientId (ForeignKey -> Patient, CASCADE DELETE)
- diseaseType (String) - Neurological or hereditary diseases
- relation (String) - Mother, Father, Sibling, Grandparent, etc.
- severity (String, can be: mild, moderate, severe)
- notes (Text, nullable)
- recordedAt (Timestamp)
```

## Privacy & Security

✅ **No Patient Names Stored** - All patient records are identified only by ID
✅ **Doctor-Scoped Access** - Doctors can only access their own patient records
✅ **Encrypted Passwords** - User passwords are bcrypt hashed
✅ **JWT Authentication** - All endpoints require valid JWT token
✅ **Role-Based Access** - Only users with 'doctor' role can create patients
✅ **Cascading Delete** - Deleting a patient removes all associated history

## Example Usage Flow

```
1. Doctor logs in and receives JWT token
2. Doctor creates a patient: POST /patients
   Response: Patient ID = 5
3. Doctor adds medical history: POST /patients/5/history
   - Adds "Hypertension" diagnosed in 2020
   - Adds "Asthma" diagnosed in childhood
4. Doctor adds family history: POST /patients/5/family-history
   - Adds "Alzheimer's" from mother
   - Adds "Stroke" from father
5. Doctor retrieves full patient data: GET /patients/5
   - Gets patient with all history and family history
6. Doctor can query all their patients: GET /patients/my-patients
```

## Error Responses

### Unauthorized (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Forbidden (403) - Not the creating doctor
```json
{
  "statusCode": 403,
  "message": "You can only access/modify/delete patients you created"
}
```

### Forbidden (403) - Not a doctor
```json
{
  "statusCode": 403,
  "message": "Only doctors can create patient records"
}
```

### Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Patient with ID X not found"
}
```

### Bad Request (400)
```json
{
  "statusCode": 400,
  "message": "Disorder field is required"
}
```

## Future Enhancements

- [ ] Support for multiple doctors accessing same patient (with permissions)
- [ ] Patient data export to CSV/PDF
- [ ] Encrypted patient notes field
- [ ] Audit logs for data access
- [ ] Symptoms tracking
- [ ] Medication side-effect tracking
- [ ] Patient consent management
- [ ] Integration with external health records
