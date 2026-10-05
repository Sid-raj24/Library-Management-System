const bookService = require('../services/bookService');

class BookController {
  async getAll(req, res) {
    try {
      const { search, category_id, limit, offset } = req.query;
      const books = await bookService.getAllBooks({ search, category_id, limit, offset });
      res.json(books);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req, res) {
    try {
      const book = await bookService.getBookById(req.params.id);
      res.json(book);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async create(req, res) {
    try {
      const book = await bookService.createBook(req.body);
      res.status(201).json(book);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async update(req, res) {
    try {
      const updatedBook = await bookService.updateBook(req.params.id, req.body);
      res.json(updatedBook);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async delete(req, res) {
    try {
      await bookService.deleteBook(req.params.id);
      res.json({ message: 'Book deleted successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new BookController();