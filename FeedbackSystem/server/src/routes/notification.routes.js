const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { Notification, User } = require('../models');

// ** Create a Notification (Admin Only) **
router.post('/create', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    try {
        const { title, message, targetRoles, targetDepartments, targetYears } = req.body;
        
        const newNotification = new Notification({
            title,
            message,
            targetRoles: targetRoles || [],
            targetDepartments: targetDepartments || [],
            targetYears: targetYears || [],
            sentBy: req.user.id
        });

        await newNotification.save();
        res.status(201).json(newNotification);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ** Get Notifications for Current User **
router.get('/', auth, async (req, res) => {
    try {
        // Fetch user context from DB to ensure fresh accurate department/year
        const user = await User.findById(req.user.id);

        const andConditions = [];

        // Condition 1: If targetRoles is defined and not empty, it must include user's role
        andConditions.push({
            $or: [
                { targetRoles: { $exists: false } },
                { targetRoles: { $size: 0 } },
                { targetRoles: user.role },
                { targetRoles: 'All' } // Optional universal fallback
            ]
        });

        // Condition 2: Evaluate Department targeting
        if (user.department) {
            andConditions.push({
                $or: [
                    { targetDepartments: { $exists: false } },
                    { targetDepartments: { $size: 0 } },
                    { targetDepartments: user.department }
                ]
            });
        }

        // Condition 3: Evaluate Year targeting
        if (user.year) {
            andConditions.push({
                $or: [
                    { targetYears: { $exists: false } },
                    { targetYears: { $size: 0 } },
                    { targetYears: user.year }
                ]
            });
        }

        const notifications = await Notification.find({ $and: andConditions }).sort({ createdAt: -1 });

        // Augment with isRead boolean for the frontend
        const formattedNotifications = notifications.map(notif => {
            const isRead = notif.readBy && notif.readBy.some(id => id.toString() === user._id.toString());
            return {
                ...notif.toObject(),
                isRead
            };
        });

        res.json(formattedNotifications);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ** Mark Notification as Read **
router.put('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        // Add user ID to readBy array if not already there
        if (!notification.readBy.includes(req.user.id)) {
            notification.readBy.push(req.user.id);
            await notification.save();
        }

        res.json({ message: 'Marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
