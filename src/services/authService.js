const crypto = require('crypto');
const nodemailer = require('nodemailer');
const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Bypasses self-signed certificate blocks
  }
});

class AuthService {
  async register(name, email, password, role) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return await userRepository.createUser(name, email, hashedPassword, role);
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async requestPasswordReset(email) {
  const cleanEmail = email.toLowerCase().trim();
  const user = await userRepository.findByEmail(cleanEmail);
  if (!user) throw new Error('Email is not registered');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
  
  await userRepository.saveResetToken(cleanEmail, otp, expiry);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: cleanEmail,
      subject: 'Your Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It is valid for 15 minutes.`
    });
    console.log(`[SMTP SUCCESS] OTP sent to ${cleanEmail}`);
  } catch (mailErr) {
    // Console log the error and fall back to printing OTP in terminal for local testing
    console.error('[SMTP ERROR] Failed to send email via network:', mailErr.message);
    console.log(`\n==================================================`);
    console.log(`[LOCAL DEV OTP FALLBACK] Email: ${cleanEmail} | OTP: ${otp}`);
    console.log(`==================================================\n`);
  }
}

  async verifyOtp(email, otp) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.reset_token !== otp || new Date() > new Date(user.reset_token_expiry)) {
      throw new Error('Invalid or expired OTP');
    }
    return true; // OTP is valid
  }

  async resetPassword(email, otp, newPassword) {
    await this.verifyOtp(email, otp); // Double-check validity before resetting
    const user = await userRepository.findByEmail(email);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(user.user_id, hashedPassword);
  }
}

module.exports = new AuthService();