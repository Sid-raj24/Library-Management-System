const bookRepository = require('../repositories/bookRepository');

class BookService {
  async getAllBooks(filters) {
    return await bookRepository.findAll(filters);
  }

  async getBookById(id) {
    const book = await bookRepository.findById(id);
    if (!book) throw new Error('Book not found');
    return book;
  }

  async createBook(bookData) {
    return await bookRepository.create(bookData);
  }

  async updateBook(id, updateData) {
    const existingBook = await bookRepository.findById(id);
    if (!existingBook) throw new Error('Book not found');

    // Retain original available count ratio if available_copies is not explicitly set
    const available_copies = updateData.available_copies !== undefined 
      ? updateData.available_copies 
      : existingBook.available_copies;

    return await bookRepository.update(id, {
      ...existingBook,
      ...updateData,
      available_copies
    });
  }

  async deleteBook(id) {
    const existingBook = await bookRepository.findById(id);
    if (!existingBook) throw new Error('Book not found');
    await bookRepository.delete(id);
  }
}

module.exports = new BookService();