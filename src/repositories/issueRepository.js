const db = require('../config/db');

class IssueRepository {
  async issueBook(userId, bookId, dueDate) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock and verify book availability
      const bookRes = await client.query(
        'SELECT available_copies FROM books WHERE book_id = $1 FOR UPDATE',
        [bookId]
      );

      if (bookRes.rows.length === 0) {
        throw new Error('Book not found');
      }
      if (bookRes.rows[0].available_copies <= 0) {
        throw new Error('No available copies left for this book');
      }

      // 2. Decrement available copies
      await client.query(
        'UPDATE books SET available_copies = available_copies - 1 WHERE book_id = $1',
        [bookId]
      );

      // 3. Insert transaction record
      const issueRes = await client.query(
        `INSERT INTO book_issues (book_id, user_id, due_date, status)
         VALUES ($1, $2, $3, 'issued')
         RETURNING *`,
        [bookId, userId, dueDate]
      );

      await client.query('COMMIT');
      return issueRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findActiveIssueById(issueId) {
    const result = await db.query(
      "SELECT * FROM book_issues WHERE issue_id = $1 AND status = 'issued'",
      [issueId]
    );
    return result.rows[0];
  }

  async returnBookTransaction(client, issueId, bookId, fineAmount) {
    // 1. Mark issue as returned
    await client.query(
      "UPDATE book_issues SET status = 'returned', return_date = CURRENT_DATE WHERE issue_id = $1",
      [issueId]
    );

    // 2. Increment available copies of the book
    await client.query(
      "UPDATE books SET available_copies = available_copies + 1 WHERE book_id = $1",
      [bookId]
    );

    // 3. If there is a fine, create a fine record
    if (fineAmount > 0) {
      await client.query(
        "INSERT INTO fines (issue_id, amount, paid_status) VALUES ($1, $2, 'unpaid')",
        [issueId, fineAmount]
      );
    }
  }

 async getActiveIssues() {
    const result = await db.query(`
      SELECT bi.issue_id, bi.user_id, bi.book_id, bi.due_date, u.name as student_name, b.title 
      FROM book_issues bi 
      JOIN users u ON bi.user_id = u.user_id 
      JOIN books b ON bi.book_id = b.book_id 
      WHERE bi.status = 'issued'
    `);
    return result.rows;
  }

  async countActiveIssuesByUser(userId) {
    const result = await db.query(
      "SELECT COUNT(*) FROM book_issues WHERE user_id = $1 AND status = 'issued'",
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  // ADD THIS MISSING METHOD:
  async createIssueTransaction(client, userId, bookId, issueDate, dueDate) {
    // 1. Insert book issue record
    await client.query(
      `INSERT INTO book_issues (user_id, book_id, issue_date, due_date, status) 
       VALUES ($1, $2, $3, $4, 'issued')`,
      [userId, bookId, issueDate, dueDate]
    );

    // 2. Decrement available copies count
    await client.query(
      `UPDATE books SET available_copies = available_copies - 1 WHERE book_id = $1`,
      [bookId]
    );
  }

  async getActiveIssuesByStudent(searchTerm) {
    const query = `
      SELECT bi.issue_id, bi.user_id, bi.book_id, bi.due_date, u.name as student_name, u.email as student_email, b.title 
      FROM book_issues bi 
      JOIN users u ON bi.user_id = u.user_id 
      JOIN books b ON bi.book_id = b.book_id 
      WHERE bi.status = 'issued' 
        AND (LOWER(u.name) LIKE $1 OR LOWER(u.email) LIKE $1)
    `;
    const result = await db.query(query, [`%${searchTerm.toLowerCase().trim()}%`]);
    return result.rows;
  }

  async findActiveIssueById(issueId) {
    const result = await db.query(
      "SELECT * FROM book_issues WHERE issue_id = $1 AND status = 'issued'",
      [issueId]
    );
    return result.rows[0];
  }

  async returnBookTransaction(client, issueId, bookId, fineAmount) {
    await client.query(
      "UPDATE book_issues SET status = 'returned', return_date = CURRENT_DATE WHERE issue_id = $1",
      [issueId]
    );

    await client.query(
      "UPDATE books SET available_copies = available_copies + 1 WHERE book_id = $1",
      [bookId]
    );

    if (fineAmount > 0) {
      await client.query(
        "INSERT INTO fines (issue_id, amount, paid_status) VALUES ($1, $2, 'unpaid')",
        [issueId, fineAmount]
      );
    }
  }

  async findByUserId(userId) {
    const result = await db.query(
      `SELECT bi.*, b.title, b.author 
       FROM book_issues bi
       JOIN books b ON bi.book_id = b.book_id
       WHERE bi.user_id = $1
       ORDER BY bi.issue_id DESC`,
      [userId]
    );
    return result.rows;
  }

  async findAll() {
    const result = await db.query(
      `SELECT bi.*, b.title, u.name as user_name, u.email
       FROM book_issues bi
       JOIN books b ON bi.book_id = b.book_id
       JOIN users u ON bi.user_id = u.user_id
       ORDER BY bi.issue_id DESC`
    );
    return result.rows;
  }
}

module.exports = new IssueRepository();