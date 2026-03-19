const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { Response, FeedbackForm, User } = require('../models');

// Get Stats for a specific Form (Admin)
// Get Detailed Stats for a specific Form (Admin)
router.get('/form/:formId', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    try {
        const formId = req.params.formId;
        // Fetch responses and populate user details if not anonymous
        const responses = await Response.find({ formId })
            .populate('submittedBy', 'name email role department semester')
            .sort({ createdAt: -1 });

        const form = await FeedbackForm.findById(formId);

        if (!form) return res.status(404).json({ message: 'Form not found' });

        let totalResponses = responses.length;
        let questionStats = {};
        let departmentStats = {};
        let semesterStats = {};
        let sentimentTotal = 0;
        let sentimentCount = 0;

        // Calculate total targeted users
        let targetFilter = {};
        if (form.targetRoles && form.targetRoles.length > 0 && !form.targetRoles.includes('All')) {
            targetFilter.role = { $in: form.targetRoles };
        }
        if (form.targetDepartments && form.targetDepartments.length > 0) {
            targetFilter.department = { $in: form.targetDepartments };
        }
        const totalTargeted = await User.countDocuments(targetFilter);

        // Initialize stats for each question
        form.questions.forEach(q => {
            let initialDist = {};
            if (q.questionType === 'Star') {
                initialDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            } else if (q.questionType === 'YesNo') {
                initialDist = { 'Yes': 0, 'No': 0 };
            } else if (q.questionType === 'MultipleChoice' && q.options) {
                q.options.forEach(opt => {
                    initialDist[opt] = 0;
                });
            }

            // Initialize for all types to track text responses too
            questionStats[q.questionText] = {
                type: q.questionType,
                total: 0,
                count: 0,
                average: 0,
                distribution: initialDist,
                textAnswers: [] // specific for text/mixed types
            };
        });

        responses.forEach(resp => {
            // Department & Semester Breakdown
            const dept = resp.department || 'Unknown';
            if (!departmentStats[dept]) departmentStats[dept] = 0;
            departmentStats[dept]++;

            const sem = resp.semester ? `Sem ${resp.semester}` : 'N/A';
            if (!semesterStats[sem]) semesterStats[sem] = 0;
            semesterStats[sem]++;

            resp.answers.forEach(ans => {
                const qStat = questionStats[ans.questionText];
                if (qStat) {
                    const qType = qStat.type;

                    if (qType === 'Star') {
                        let val = parseInt(ans.answer) || 0;
                        if (val >= 1 && val <= 5) {
                            qStat.total += val;
                            qStat.count++;
                            qStat.distribution[val] = (qStat.distribution[val] || 0) + 1;
                        }
                    } else if (qType === 'MultipleChoice' || qType === 'YesNo') {
                        const val = ans.answer;
                        if (val) {
                            qStat.count++;
                            qStat.distribution[val] = (qStat.distribution[val] || 0) + 1;
                        }
                    }

                    // Collect text answers for all types (useful for Text type)
                    if (ans.answer && typeof ans.answer === 'string') {
                        if (qStat.textAnswers.length < 50) {
                            qStat.textAnswers.push(ans.answer);
                        }
                    }

                    // Sentiment Analysis
                    if (ans.sentimentScore !== undefined && ans.sentimentScore !== 0) {
                        sentimentTotal += ans.sentimentScore;
                        sentimentCount++;
                    }
                }
            });
        });

        // Finalize Averages and Rankings
        let ratedQuestions = [];

        Object.keys(questionStats).forEach(key => {
            const q = questionStats[key];
            if (q.count > 0 && q.type === 'Star') {
                q.average = parseFloat((q.total / q.count).toFixed(2));
                ratedQuestions.push({ question: key, average: q.average });
            }
        });

        // Sort questions by average rating
        ratedQuestions.sort((a, b) => b.average - a.average);
        const highestRated = ratedQuestions.slice(0, 3);
        const lowestRated = ratedQuestions.slice(-3).reverse(); // Bottom 3, worst first

        // Format responses for frontend table
        const formattedResponses = responses.map(r => {
            // Calculate average rating for this specific response if applicable
            let totalRating = 0;
            let count = 0;
            r.answers.forEach(a => {
                // Check if answer matches a rating question type (by text lookup or just assume numeric)
                // We don't have question type strictly here without looking up form, but numeric check is a good proxy for Star ratings
                const val = parseInt(a.answer);
                if (!isNaN(val) && val >= 1 && val <= 5) { // Strict 1-5 check to avoid years/ages
                    totalRating += val;
                    count++;
                }
            });
            const avgRating = count > 0 ? (totalRating / count).toFixed(1) : '-';

            return {
                id: r._id,
                user: r.isAnonymous ? 'Anonymous' : (r.submittedBy?.name || 'Unknown User'),
                role: r.isAnonymous ? 'N/A' : (r.submittedBy?.role || 'N/A'),
                department: r.department,
                date: r.createdAt,
                sentiment: r.answers.reduce((acc, curr) => acc + (curr.sentimentScore || 0), 0),
                avgRating,
                answers: r.answers
            };
        });

        res.json({
            formTitle: form.title,
            totalResponses,
            totalTargeted,
            questionStats,
            highestRated,
            lowestRated,
            departmentStats,
            semesterStats,
            responses: formattedResponses, // Send full list for table
            averageSentiment: sentimentCount > 0 ? (sentimentTotal / sentimentCount).toFixed(2) : 0,
            attachedPdf: form.attachedPdf
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
