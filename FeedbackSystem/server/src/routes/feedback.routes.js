const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { FeedbackForm, Response } = require('../models');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, `feedback-pdf-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// Create Feedback Form (Admin only)
router.post('/create', auth, upload.single('pdfFile'), async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    try {
        let { title, description, startDate, endDate } = req.body;
        let targetRoles, targetDepartments, targetYears, questions;

        // Parse JSON stringified fields sent via FormData
        try {
            targetRoles = req.body.targetRoles ? JSON.parse(req.body.targetRoles) : [];
            targetDepartments = req.body.targetDepartments ? JSON.parse(req.body.targetDepartments) : [];
            targetYears = req.body.targetYears ? JSON.parse(req.body.targetYears) : [];
            questions = req.body.questions ? JSON.parse(req.body.questions) : [];
        } catch (parseError) {
            console.error('Error parsing arrays', parseError);
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const newForm = new FeedbackForm({
            title,
            description,
            targetRoles,
            targetDepartments,
            targetYears,
            startDate,
            endDate,
            questions,
            createdBy: req.user.id,
            attachedPdf: req.file ? `/uploads/${req.file.filename}` : null
        });
        const form = await newForm.save();
        res.json(form);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get Active Forms (For Users)
router.get('/active', auth, async (req, res) => {
    try {
        const now = new Date();

        // Fetch user from DB to get fresh department/year as token might be stale
        const user = await req.userFromDB || await (require('../models').User.findById(req.user.id));

        // Build query conditions
        const andConditions = [
            { startDate: { $lte: now } },
            { endDate: { $gte: now } },
            { isActive: true },
            { targetRoles: { $in: [user.role] } }
        ];

        if (user.department) {
            andConditions.push({
                $or: [
                    { targetDepartments: { $exists: false } },
                    { targetDepartments: { $size: 0 } },
                    { targetDepartments: user.department }
                ]
            });
        }

        if (user.year) {
            andConditions.push({
                $or: [
                    { targetYears: { $exists: false } }, // Field doesn't exist
                    { targetYears: { $size: 0 } },       // Empty array = All years
                    { targetYears: user.year }           // Specific year match
                ]
            });
        }

        const forms = await FeedbackForm.find({ $and: andConditions });

        // Check if user has submitted each form and add response count
        const formsWithSubmissionStatus = await Promise.all(forms.map(async (form) => {
            const hasSubmitted = await Response.exists({
                formId: form._id,
                submittedBy: user._id
            });

            const responseCount = await Response.countDocuments({ formId: form._id });

            return {
                ...form.toObject(),
                hasSubmitted: !!hasSubmitted,
                responseCount
            };
        }));

        res.json(formsWithSubmissionStatus);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Get All Forms (Admin)
router.get('/all', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });
    try {
        const forms = await FeedbackForm.find().sort({ createdAt: -1 });

        // Add response count for each form
        const formsWithCount = await Promise.all(forms.map(async (form) => {
            const responseCount = await Response.countDocuments({ formId: form._id });
            return {
                ...form.toObject(),
                responseCount
            };
        }));

        res.json(formsWithCount);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete Form
router.delete('/delete/:id', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });
    try {
        await FeedbackForm.findByIdAndDelete(req.params.id);
        await Response.deleteMany({ formId: req.params.id });
        res.json({ message: 'Form deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Submit Response
router.post('/submit', auth, async (req, res) => {
    const { formId, answers, isAnonymous } = req.body;

    try {
        const existingResponse = await Response.findOne({ formId, submittedBy: req.user.id });
        if (existingResponse) return res.status(400).json({ message: 'You have already submitted feedback for this form.' });

        // Calculate sentiment for text answers
        const processedAnswers = answers.map(ans => {
            let score = 0;
            if (typeof ans.answer === 'string' && ans.answer.length > 5) { // Basic check for text
                const result = sentiment.analyze(ans.answer);
                score = result.score;
            }
            return { ...ans, sentimentScore: score };
        });

        // Determine submitter info based on anonymity
        const responseData = {
            formId,
            submittedBy: req.user.id,
            isAnonymous,
            answers: processedAnswers,
            department: req.body.department || 'General', // Should fetch from user profile really
            semester: req.body.semester
        };

        const newResponse = new Response(responseData);
        await newResponse.save();
        res.json({ message: 'Feedback submitted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get User's Submission History
router.get('/history', auth, async (req, res) => {
    try {
        const responses = await Response.find({ submittedBy: req.user.id })
            .populate('formId', 'title description startDate endDate')
            .sort({ createdAt: -1 });
        res.json(responses);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;

