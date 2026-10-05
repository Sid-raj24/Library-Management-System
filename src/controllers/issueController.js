const issueService = require('../services/issueService');

class IssueController {
  async issueBook(req, res) {
    try {
      const { studentEmail, bookTitle } = req.body;
      const result = await issueService.issueBookToStudent(studentEmail, bookTitle);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async returnBook(req, res) {
    try {
      const { issue_id } = req.body;
      const result = await issueService.returnBook(issue_id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getMyHistory(req, res) {
    try {
      const history = await issueService.getUserBorrowHistory(req.user.userId);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getAll(req, res) {
    try {
      const transactions = await issueService.getAllTransactions();
      res.json(transactions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getActiveIssuesByStudent(req, res) {
    try {
      const { search } = req.query;
      if (!search) return res.json([]);
      const issues = await issueService.getActiveIssuesByStudent(search);
      res.json(issues);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getActiveIssues(req, res) {
    try {
      const issues = await issueService.getActiveIssues();
      res.json(issues);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new IssueController();