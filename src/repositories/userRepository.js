const db = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );
    return result.rows[0];
  }

  async createUser(name, email, password, role) {
    const normalizedEmail = email.toLowerCase().trim();
        const result = await db.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, normalizedEmail, password, role]
        );
        return result.rows[0];
    }

    async findById(id) {
        const result = await db.query(
        'SELECT user_id, name, email, role, created_at FROM users WHERE user_id = $1',
        [id]
        );
        return result.rows[0];
    }

    async saveResetToken(email, token, expiry) {
        const normalizedEmail = email.toLowerCase().trim();
        await db.query(
        'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE LOWER(email) = $3',
        [token, expiry, normalizedEmail]
        );
    }

    async findByResetToken(token) {
        const result = await db.query(
            'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > CURRENT_TIMESTAMP',
            [token]
        );
        return result.rows[0];
    }

    async updatePassword(userId, hashedPassword) {
        await db.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2',
            [hashedPassword, userId]
        );
    }
}

module.exports = new UserRepository();