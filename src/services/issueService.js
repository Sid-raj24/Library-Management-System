const userRepository = require('../repositories/userRepository'); 
const bookRepository = require('../repositories/bookRepository');
const issueRepository = require('../repositories/issueRepository');
const db = require('../config/db');

class IssueService {
  async checkoutBook(userId, bookId, daysToKeep = 14) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToKeep);

    return await issueRepository.issueBook(userId, bookId, dueDate);
  }

  async issueBookToStudent(studentEmail, bookTitle) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Verify student
      const cleanEmail = studentEmail.toLowerCase().trim();
      const user = await userRepository.findByEmail(cleanEmail);
      if (!user) throw new Error('Student email is not registered');

      // 2. Check 5-book active issue limit
      const activeCount = await issueRepository.countActiveIssuesByUser(user.user_id);
      if (activeCount >= 5) {
        throw new Error(`Student ${user.name} already has 5 active borrowed books (Maximum limit reached).`);
      }

      // 3. Find book by title and check stock
      const book = await bookRepository.findByTitle(bookTitle);
      if (!book) throw new Error('Book title not found in catalog');
      if (book.available_copies < 1) throw new Error(`"${book.title}" is currently out of stock`);

      // 4. Set issue dates (14 days return period)
      const issueDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // 5. Issue transaction
      await issueRepository.createIssueTransaction(client, user.user_id, book.book_id, issueDate, dueDate);

      await client.query('COMMIT');
      return { message: `"${book.title}" successfully issued to ${user.name}` };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async processReturn(issueId) {
    const returnDate = new Date();
    const allIssues = await issueRepository.findAll();
    const issue = allIssues.find(i => i.issue_id === parseInt(issueId));

    if (!issue) {
      throw new Error('Issue record not found');
    }

    const dueDate = new Date(issue.due_date);
    let fineAmount = 0;

    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const FINE_PER_DAY = 5.00; // $5/day
      fineAmount = diffDays * FINE_PER_DAY;
    }

    return await issueRepository.returnBook(issueId, returnDate, fineAmount);
  }

  async getUserBorrowHistory(userId) {
    return await issueRepository.findByUserId(userId);
  }

  async getAllTransactions() {
    return await issueRepository.findAll();
  }

  async getActiveIssues() {
    return await issueRepository.getActiveIssues();
  }

  async returnBook(issueId) {
    const client = await db.pool.connect(); // Works properly once db is imported
    try {
      await client.query('BEGIN');

      const issue = await issueRepository.findActiveIssueById(issueId);
      if (!issue) throw new Error('Active book issue record not found');

      const dueDate = new Date(issue.due_date);
      const today = new Date();
      let fineAmount = 0;

      if (today > dueDate) {
        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        fineAmount = diffDays * 1.00;
      }

      await issueRepository.returnBookTransaction(client, issueId, issue.book_id, fineAmount);

      await client.query('COMMIT');
      return { message: 'Book returned successfully', fine: fineAmount };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getActiveIssuesByStudent(searchTerm) {
    return await issueRepository.getActiveIssuesByStudent(searchTerm);
  }
}

module.exports = new IssueService();