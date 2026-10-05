const db = require('../config/db');

class DashboardRepository {
  async getStudentStats(userId) {
    // Convert to integer to guarantee SQL type matching
    const id = parseInt(userId, 10);

    const activeRes = await db.query(
      "SELECT COUNT(*) FROM book_issues WHERE user_id = $1 AND status = 'issued'",
      [id]
    );

    const totalRes = await db.query(
      "SELECT COUNT(*) FROM book_issues WHERE user_id = $1",
      [id]
    );

    const fineRes = await db.query(
      `SELECT COALESCE(SUM(f.amount), 0) AS total 
       FROM fines f 
       JOIN book_issues bi ON f.issue_id = bi.issue_id 
       WHERE bi.user_id = $1 AND f.paid_status = 'unpaid'`,
      [id]
    );

    return {
      active_issues: parseInt(activeRes.rows[0].count, 10),
      total_issued: parseInt(totalRes.rows[0].count, 10),
      unpaid_fines: parseFloat(fineRes.rows[0].total)
    };
  }

  async getAdminStats() {
    const totalBooks = await db.query('SELECT COUNT(*) FROM books');
    const totalCopies = await db.query('SELECT COALESCE(SUM(available_copies), 0) AS total FROM books');
    const activeIssues = await db.query("SELECT COUNT(*) FROM book_issues WHERE status = 'issued'");
    const totalFines = await db.query("SELECT COALESCE(SUM(amount), 0) AS total FROM fines WHERE paid_status = 'unpaid'");

    return {
      total_books: parseInt(totalBooks.rows[0].count, 10),
      total_copies: parseInt(totalCopies.rows[0].total, 10),
      active_issues: parseInt(activeIssues.rows[0].count, 10),
      total_fines: parseFloat(totalFines.rows[0].total)
    };
  }
}

module.exports = new DashboardRepository();