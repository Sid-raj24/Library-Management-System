const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;
      const user = await authService.register(name, email, password, role);
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  }

  async forgotPassword(req, res) {
    try {
      await authService.requestPasswordReset(req.body.email);
      res.json({ message: 'OTP sent to your email' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async verifyOtp(req, res) {
    try {
      await authService.verifyOtp(req.body.email, req.body.otp);
      res.json({ message: 'OTP verified successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;
      await authService.resetPassword(email, otp, newPassword);
      res.json({ message: 'Password has been successfully reset' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new AuthController();