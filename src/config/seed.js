const db = require('./db');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  try {
    // 1. Insert initial categories
    const categories = ['Technology', 'Fiction', 'Science', 'History'];
    for (const cat of categories) {
      await db.query(
        'INSERT INTO categories (category_name) VALUES ($1) ON CONFLICT DO NOTHING',
        [cat]
      );
    }

    // 2. Insert a default Admin user (Password: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      ['System Admin', 'admin@library.com', hashedPassword, 'admin']
    );

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();