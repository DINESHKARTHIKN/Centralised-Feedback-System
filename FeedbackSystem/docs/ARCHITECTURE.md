# System Architecture

## ER Diagram Explanation

The database consists of three main collections: **Users**, **FeedbackForms**, and **Responses**.

### 1. User Entity
- **Purpose**: Stores authentication details and profile information for all stakeholders.
- **Key Fields**: `_id`, `name`, `email`, `password` (hashed), `role` (Enum: Admin, Student, Teacher, etc.), `department`, `semester`.
- **Relationships**:
  - One User (Admin) can create multiple FeedbackForms.
  - One User (Student/Teacher/etc) can submit multiple Responses.

### 2. FeedbackForm Entity
- **Purpose**: Defines the structure and constraints of a feedback survey.
- **Key Fields**: `_id`, `title`, `description`, `targetRoles` (Array of roles allowed to answer), `questions` (Array of objects with type and text), `startDate`, `endDate`.
- **Relationships**:
  - Belongs to a User (Creator).
  - Has many Responses.

### 3. Response Entity
- **Purpose**: Stores the actual answers provided by a user for a specific form.
- **Key Fields**: `_id`, `formId` (Reference), `submittedBy` (Reference to User, nullable if anonymous), `answers` (Array of answer objects matching the form questions), `sentimentScore`.
- **Relationships**:
  - Belongs to a FeedbackForm.
  - Belongs to a User (optional).

## Sample JSON Payloads

### 1. Create Feedback Form (Admin)
**POST** `/api/feedback/create`
```json
{
  "title": "Semester 5 Course Feedback",
  "description": "Please provide your honest feedback for the recently concluded semester.",
  "targetRoles": ["Student"],
  "startDate": "2023-11-01T00:00:00.000Z",
  "endDate": "2023-11-15T23:59:59.000Z",
  "questions": [
    {
      "questionText": "Rate the course content relevance",
      "questionType": "Star"
    },
    {
      "questionText": "Was the faculty approachable?",
      "questionType": "YesNo"
    },
    {
      "questionText": "What improvements do you suggest?",
      "questionType": "Text"
    }
  ]
}
```

### 2. Submit Feedback (Student)
**POST** `/api/feedback/submit`
```json
{
  "formId": "654321abcdef123456789012",
  "isAnonymous": false,
  "department": "CSE",
  "semester": 5,
  "answers": [
    {
      "questionText": "Rate the course content relevance",
      "answer": "4"
    },
    {
      "questionText": "Was the faculty approachable?",
      "answer": "Yes"
    },
    {
      "questionText": "What improvements do you suggest?",
      "answer": "More practical lab sessions would be helpful."
    }
  ]
}
```

### 3. Analytics Response (Admin)
**GET** `/api/analytics/form/654321abcdef123456789012`
```json
{
  "formTitle": "Semester 5 Course Feedback",
  "totalResponses": 45,
  "averageSentiment": 2.4,
  "questionStats": {
    "Rate the course content relevance": {
      "total": 180,
      "count": 45,
      "average": 4.0,
      "distribution": {
        "1": 2,
        "2": 5,
        "3": 10,
        "4": 15,
        "5": 13
      }
    },
    "Was the faculty approachable?": {
      "total": 215, // Yes=5, No=1 mapping
      "count": 45,
      "average": 4.7,
      "distribution": {
        "5": 40,
        "1": 5
      }
    }
  }
}
```
