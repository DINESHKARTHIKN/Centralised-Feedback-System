const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Admin', 'Student', 'Alumni', 'Teacher', 'Parent', 'Staff', 'Recruiter'],
    default: 'Student'
  },
  department: { type: String }, // For students/teachers
  year: { type: Number, min: 1, max: 4 }, // Replaces semester, purely Academic Year (1-4)
  semester: { type: Number }, // Kept for backward compatibility or specific semester info if needed
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Feedback Form Schema
const feedbackFormSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  targetRoles: [{ type: String }], // e.g. ['Student']
  targetDepartments: [{ type: String }], // e.g. ['CSE', 'ECE'] - empty means all
  targetYears: [{ type: Number }], // e.g. [1, 2] - empty means all
  questions: [{
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ['Star', 'MultipleChoice', 'Text', 'YesNo'],
      required: true
    },
    options: [{ type: String }] // For MultipleChoice
  }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachedPdf: { type: String } // URL or path to the optional PDF
}, { timestamps: true });

// Response Schema
const responseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedbackForm', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Can be null if anonymous
  isAnonymous: { type: Boolean, default: false },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId }, // Logic mapping to question index or ID
    questionText: { type: String },
    answer: { type: mongoose.Schema.Types.Mixed }, // String, Number, etc.
    sentimentScore: { type: Number } // For text answers
  }],
  department: { type: String },
  semester: { type: Number }, // Snapshot of student's semester
}, { timestamps: true });

// Notification Schema
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  targetRoles: [{ type: String }], // empty means all
  targetDepartments: [{ type: String }], // empty means all
  targetYears: [{ type: Number }], // empty means all
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Users who have read it
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const FeedbackForm = mongoose.model('FeedbackForm', feedbackFormSchema);
const Response = mongoose.model('Response', responseSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { User, FeedbackForm, Response, Notification };
