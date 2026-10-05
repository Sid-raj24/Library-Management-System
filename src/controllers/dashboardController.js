const dashboardRepository = require('../repositories/dashboardRepository');

class DashboardController {
  async getStats(req, res) {
    try {
      // console.log('--> Dashboard req.user:', req.user); // Debug log

      const role = req.user.role;
      // Extract ID and convert to Integer to match PostgreSQL data type
      const rawId = req.user.user_id || req.user.id || req.user.userId;
      const studentId = parseInt(rawId, 10);

      if (role === 'admin' || role === 'librarian') {
        const stats = await dashboardRepository.getAdminStats();
        return res.json(stats);
      } else {
        if (isNaN(studentId)) {
          console.error('--> Error: Invalid or missing Student ID in req.user');
          return res.status(400).json({ error: 'User ID missing in token' });
        }

        const metrics = await dashboardRepository.getStudentStats(studentId);
        // console.log(`--> Calculated metrics for Student ID ${studentId}:`, metrics); // Debug log

        return res.json({ metrics });
      }
    } catch (err) {
      console.error('--> Dashboard Stats Error:', err);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new DashboardController();