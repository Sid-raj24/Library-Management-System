const db = require('../config/db');

class BookRepository {
  async findAll() {
    const result = await db.query('SELECT * FROM books ORDER BY book_id ASC');
    return result.rows;
  }

  async findById(bookId) {
    const result = await db.query('SELECT * FROM books WHERE book_id = $1', [bookId]);
    return result.rows[0];
  }

  async findByTitle(title) {
    const result = await db.query(
      'SELECT * FROM books WHERE LOWER(title) = LOWER($1)',
      [title.trim()]
    );
    return result.rows[0];
  }

  async createBook(bookData) {
    const { 
      title, 
      author, 
      isbn, 
      copies, 
      total_copies, 
      available_copies, 
      genre = null, 
      shelf_location = null 
    } = bookData;

    const numCopies = copies || total_copies || available_copies || 1;

    const query = `
      INSERT INTO books (title, author, isbn, total_copies, available_copies, genre, shelf_location)
      VALUES ($1, $2, $3, $4, $4, $5, $6)
      RETURNING *
    `;

    const result = await db.query(query, [
      title, 
      author, 
      isbn, 
      numCopies, 
      genre, 
      shelf_location
    ]);

    return result.rows[0];
  }

  async update(book_id, { title, author, genre = null, total_copies, available_copies, shelf_location = null }) {
    const result = await db.query(
      `UPDATE books
       SET title = $1, 
           author = $2, 
           genre = $3, 
           total_copies = $4, 
           available_copies = $5, 
           shelf_location = $6
       WHERE book_id = $7
       RETURNING *`,
      [title, author, genre, total_copies, available_copies, shelf_location, book_id]
    );
    return result.rows[0];
  }

  // Delete book by primary key ID
  async delete(bookId) {
    const result = await db.query(
      'DELETE FROM books WHERE book_id = $1 RETURNING *',
      [bookId]
    );
    return result.rows[0];
  }
}

module.exports = new BookRepository();