const User = require('../models/User');
const { publishEvent } = require('../rabbitmq/connection');

const buildUserResponse = (user) => ({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    headline: user.headline,
    bio: user.bio,
    location: user.location,
    profilePicUrl: user.profilePicUrl,
    coverPicUrl: user.coverPicUrl,
    batchYear: user.batchYear,
    graduationYear: user.graduationYear,
    skills: user.skills || [],
    links: user.links || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash -__v');

        if (user) {
            res.json(buildUserResponse(user));
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id || req.user._id);

        if (user) {
            // Check authorization to update (must be the same user or admin)
            if (user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to update this profile' });
            }

            // Update allowed fields
            user.fullName = req.body.fullName ?? user.fullName;
            user.headline = req.body.headline ?? user.headline;
            user.bio = req.body.bio ?? user.bio;
            user.location = req.body.location ?? user.location;
            user.profilePicUrl = req.body.profilePicUrl ?? user.profilePicUrl;
            user.coverPicUrl = req.body.coverPicUrl ?? user.coverPicUrl;
            user.batchYear = req.body.batchYear ?? user.batchYear;
            user.graduationYear = req.body.graduationYear ?? user.graduationYear;

            if (req.body.skills !== undefined) {
                user.skills = Array.isArray(req.body.skills) ? req.body.skills : [req.body.skills];
            }

            if (req.body.links !== undefined) {
                user.links = Array.isArray(req.body.links) ? req.body.links : [req.body.links];
            }

            // Password update requires separate logic or check
            if (req.body.password) {
                const bcrypt = require('bcryptjs');
                const salt = await bcrypt.genSalt(10);
                user.passwordHash = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();

            await publishEvent('decp_events', 'user.updated', {
                userId: updatedUser._id.toString(),
                snapshot: {
                    name: updatedUser.fullName || 'Unknown User',
                    profilePicUrl: updatedUser.profilePicUrl || '',
                    headline: updatedUser.headline || ''
                }
            });

            res.json(buildUserResponse(updatedUser));
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all users (with optional filtering like role)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;

        const query = {};
        if (role) query.role = role;
        if (search) {
            query.$text = { $search: search };
        }

        const users = await User.find(query)
            .select('-passwordHash -__v')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.countDocuments(query);

        res.json({
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await User.deleteOne({ _id: user._id });
            res.json({ message: 'User removed completely' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete own account
// @route   DELETE /api/users/profile
// @access  Private
const deleteOwnAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.deleteOne({ _id: user._id });
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getUsers,
    deleteUser,
    deleteOwnAccount
};
