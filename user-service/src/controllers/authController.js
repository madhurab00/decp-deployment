const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const crypto = require('crypto');

const getSafeProfilePicClaim = (profilePicUrl) => {
    if (!profilePicUrl) {
        return undefined;
    }

    if (profilePicUrl.startsWith('data:') || profilePicUrl.length > 512) {
        return undefined;
    }

    return profilePicUrl;
};

const buildAccessTokenPayload = (user) => ({
    userId: user._id,
    role: user.role,
    fullName: user.fullName,
    headline: user.headline,
    profilePicUrl: getSafeProfilePicClaim(user.profilePicUrl),
});

// Helper to generate access and refresh tokens
const generateTokens = async (user) => {
    const accessToken = jwt.sign(
        buildAccessTokenPayload(user),
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    const refreshTokenValue = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');

    // Refresh token expires in 7 days by default
    const expireDays = parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS) || 7;
    const expiresAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
        userId: user._id,
        tokenHash,
        expiresAt,
    });

    return { accessToken, refreshToken: refreshTokenValue };
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { email, password, fullName, role } = req.body;

        // Validate request
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            email,
            passwordHash,
            fullName,
            role: role && ['student', 'alumni', 'admin'].includes(role) ? role : 'student'
        });

        if (user) {
            const { accessToken, refreshToken } = await generateTokens(user);

            // Set cookie options
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: (parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS) || 7) * 24 * 60 * 60 * 1000
            };

            res.cookie('accessToken', accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000 // 15 mins for access token in cookie
            });
            res.cookie('refreshToken', refreshToken, cookieOptions);

            res.status(201).json({
                data: {
                    token: accessToken,
                    user: {
                        _id: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role,
                        headline: user.headline,
                        bio: user.bio,
                        location: user.location,
                        profilePicUrl: user.profilePicUrl,
                        coverPicUrl: user.coverPicUrl,
                        batchYear: user.batchYear,
                        graduationYear: user.graduationYear,
                        skills: user.skills || [],
                        links: user.links || []
                    }
                }
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate request
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find User
        const user = await User.findOne({ email });

        // Validate password
        if (user && (await bcrypt.compare(password, user.passwordHash))) {

            const { accessToken, refreshToken } = await generateTokens(user);

            // Set cookie options
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: (parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS) || 7) * 24 * 60 * 60 * 1000
            };

            res.cookie('accessToken', accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000 // 15 mins
            });
            res.cookie('refreshToken', refreshToken, cookieOptions);

            res.json({
                data: {
                    token: accessToken,
                    user: {
                        _id: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role,
                        headline: user.headline,
                        bio: user.bio,
                        location: user.location,
                        profilePicUrl: user.profilePicUrl,
                        coverPicUrl: user.coverPicUrl,
                        batchYear: user.batchYear,
                        graduationYear: user.graduationYear,
                        skills: user.skills || [],
                        links: user.links || []
                    }
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Not authorized, no refresh token' });
        }

        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const existingRefreshToken = await RefreshToken.findOne({ tokenHash });

        if (!existingRefreshToken || existingRefreshToken.revokedAt || Date.now() > existingRefreshToken.expiresAt) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        const user = await User.findById(existingRefreshToken.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Generate new access token
        const accessToken = jwt.sign(
            buildAccessTokenPayload(user),
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '15m' }
        );

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (refreshToken) {
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            await RefreshToken.findOneAndUpdate({ tokenHash }, { revokedAt: new Date() });
        }

        res.cookie('accessToken', '', {
            httpOnly: true,
            expires: new Date(0)
        });

        res.cookie('refreshToken', '', {
            httpOnly: true,
            expires: new Date(0)
        });

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    refresh,
    logout
};
