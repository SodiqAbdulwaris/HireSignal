const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const { sendEmail } = require('../services/email.service');
const { z } = require('zod');

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters long');

function signAccessToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.accessTokenExpiry }
  );
}

function buildVerificationLink(verificationToken) {
  const link = new URL('/verify-email', config.frontendUrl);
  link.searchParams.set('token', verificationToken);
  return link.toString();
}

function sendVerificationEmail(user) {
  const verificationToken = jwt.sign(
    { userId: user._id, purpose: 'email-verification' },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
  const verifyLink = buildVerificationLink(verificationToken);

  return sendEmail({
    to: user.email,
    subject: 'Verify your email for HireSignal',
    text: `Hello ${user.fullName},\n\nPlease verify your email by clicking the following link:\n${verifyLink}\n\nThis link is valid for 24 hours.`,
    html: `
      <p>Hello ${user.fullName},</p>
      <p>Please verify your email for HireSignal by clicking the button below:</p>
      <p>
        <a href="${verifyLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:500;">
          Verify Email
        </a>
      </p>
      <p>Or copy and paste this link in your browser: <br>${verifyLink}</p>
      <p>This link is valid for 24 hours.</p>
    `,
  });
}

async function generateAndSetRefreshToken(res, userId) {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await RefreshToken.create({
    token: hashedToken,
    userId,
    expiresAt,
  });

  res.cookie('refreshToken', rawToken, {
    httpOnly: true,
    sameSite: config.authCookieSameSite,
    secure: config.authCookieSecure,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return rawToken;
}

/**
 * POST /api/v1/auth/register
 * Register a new user with email verification.
 */
async function register(req, res, next) {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fullName, email, password, and role.',
        data: null,
      });
    }

    if (role && !['candidate', 'recruiter'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles are candidate or recruiter.',
        data: null,
      });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered.',
        data: null,
      });
    }

    const user = await User.create({
      fullName,
      email: email.toLowerCase().trim(),
      password,
      role,
      isVerified: false,
    });

    // No access/refresh tokens issued here — the account can't be used until
    // verified, so there's nothing for a session to unlock yet.
    sendVerificationEmail(user).catch((error) => {
      console.error('[Register] Error sending verification email:', error);
    });

    return res.status(202).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account before logging in.',
      data: {
        needsVerification: true,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 * Log in a user using email and password.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
        data: null,
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        data: null,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        data: null,
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated.',
        data: null,
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        data: { needsVerification: true },
      });
    }

    const token = signAccessToken(user);
    await generateAndSetRefreshToken(res, user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using httpOnly cookie.
 */
async function refresh(req, res, next) {
  try {
    const rawToken = req.cookies.refreshToken;
    if (!rawToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing.', data: null });
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenDoc = await RefreshToken.findOne({ token: hashedToken });

    if (!tokenDoc) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.', data: null });
    }

    if (tokenDoc.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      res.clearCookie('refreshToken');
      return res.status(401).json({ success: false, message: 'Expired refresh token.', data: null });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      res.clearCookie('refreshToken');
      return res.status(401).json({ success: false, message: 'User not found.', data: null });
    }

    if (user.isDeleted) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      res.clearCookie('refreshToken');
      return res.status(401).json({ success: false, message: 'This account has been deactivated.', data: null });
    }

    await RefreshToken.deleteOne({ _id: tokenDoc._id });
    const newAccessToken = signAccessToken(user);
    await generateAndSetRefreshToken(res, user._id);

    return res.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        token: newAccessToken,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 * Log out user, deleting refresh token and cookie.
 */
async function logout(req, res, next) {
  try {
    const rawToken = req.cookies.refreshToken;
    if (rawToken) {
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      await RefreshToken.deleteOne({ token: hashedToken });
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: config.authCookieSameSite,
      secure: config.authCookieSecure,
    });
    return res.json({
      success: true,
      message: 'Logged out successfully.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 * Return the currently authenticated user's profile.
 */
async function getMe(req, res) {
  return res.json({
    success: true,
    message: 'User profile retrieved.',
    data: {
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
    },
  });
}

/**
 * DELETE /api/v1/auth/me
 * Self-service account deletion — soft-deletes the caller's own account
 * (same isDeleted flag admin.controller's deactivateUser uses) and revokes
 * every refresh token for it so existing sessions stop working immediately.
 */
async function deleteMyAccount(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.user._id, { isDeleted: true });
    await RefreshToken.deleteMany({ userId: req.user._id });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: config.authCookieSameSite,
      secure: config.authCookieSecure,
    });

    return res.json({
      success: true,
      message: 'Your account has been deleted.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/verify-email
 * Verify verification token and update user's verification status.
 */
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.', data: null });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.', data: null });
    }

    if (decoded.purpose !== 'email-verification') {
      return res.status(400).json({ success: false, message: 'Invalid token purpose.', data: null });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found.', data: null });
    }

    if (user.isVerified) {
      return res.status(200).json({ success: true, message: 'Email already verified. You can now log in.', data: null });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified. You can now log in.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/resend-verification
 * Resend the verification email to the user.
 */
async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.', data: null });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user || user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'If that email is registered and unverified, a verification link has been sent.',
        data: null,
      });
    }

    sendVerificationEmail(user).catch((error) => {
      console.error('[Resend Verify] Error sending verification email in background:', error);
    });

    return res.status(200).json({
      success: true,
      message: 'If that email is registered and unverified, a verification link has been sent.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/forgot-password
 * Handle forgot password request.
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.', data: null });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (user) {
      const resetToken = jwt.sign(
        { userId: user._id, purpose: 'password-reset', tokenVersion: user.passwordResetVersion },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;

      sendEmail({
        to: user.email,
        subject: 'Reset your password for HireSignal',
        text: `Hello ${user.fullName},\n\nYou requested a password reset. Please click the link below to set a new password:\n${resetLink}\n\nThis link is valid for 1 hour.`,
        html: `
          <p>Hello ${user.fullName},</p>
          <p>Please reset your password for HireSignal by clicking the button below:</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:500;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link in your browser: <br>${resetLink}</p>
          <p>This link is valid for 1 hour.</p>
        `
      }).catch(error => {
        console.error('[Forgot Password] Error sending reset email in background:', error);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/reset-password
 * Handle reset password.
 */
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.', data: null });
    }

    const validation = passwordSchema.safeParse(newPassword);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues[0].message,
        data: null,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.', data: null });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ success: false, message: 'Invalid token purpose.', data: null });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found.', data: null });
    }

    if (decoded.tokenVersion !== user.passwordResetVersion) {
      return res.status(400).json({ success: false, message: 'This reset link has already been used or is invalidated.', data: null });
    }

    user.password = newPassword;
    user.passwordResetVersion += 1;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  buildVerificationLink,
  register,
  login,
  logout,
  getMe,
  deleteMyAccount,
  refresh,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
