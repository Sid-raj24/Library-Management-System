const API = 'http://localhost:5000/api';
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token || (role !== 'admin' && role !== 'librarian')) {
  alert('Access Denied: Unauthorized');
  window.location.replace('index.html'); // Replaces history state so they can't click "Back"
}

document.getElementById('welcome').innerText = `Admin Portal - ${localStorage.getItem('name')}`;

async function loadStats() {
  try {
    const res = await fetch(`${API}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const statsContainer = document.getElementById('admin-stats');
    
    if (!statsContainer) return;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <span class="stat-value">${data.total_books || 0}</span>
        <span class="stat-label">Total Titles</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${data.total_copies || 0}</span>
        <span class="stat-label">Available Copies</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${data.active_issues || 0}</span>
        <span class="stat-label">Books Checked Out</span>
      </div>
      <div class="stat-card warning">
        <span class="stat-value">$${parseFloat(data.total_fines || 0).toFixed(2)}</span>
        <span class="stat-label">Pending Fines</span>
      </div>
    `;
  } catch (err) {
    console.error('Failed to load system overview stats:', err);
  }
}

async function addBook(event) {
  event.preventDefault();

  const titleInput = document.getElementById('book-title');
  const authorInput = document.getElementById('book-author');
  const isbnInput = document.getElementById('book-isbn');
  const copiesInput = document.getElementById('book-copies');
  const genreInput = document.getElementById('book-genre');

  if (!titleInput || !authorInput || !isbnInput || !copiesInput) {
    alert('Form inputs missing in HTML. Please check element IDs.');
    return;
  }

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const isbn = isbnInput.value.trim();
  const copies = parseInt(copiesInput.value, 10);
  const genre = genreInput && genreInput.value.trim() ? genreInput.value.trim() : null;

  try {
    const res = await fetch(`${API}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        title, 
        author, 
        isbn, 
        copies, 
        total_copies: copies, 
        available_copies: copies, 
        genre 
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Book added successfully!');
      document.getElementById('add-book-form').reset();

      if (typeof loadBooks === 'function') loadBooks();
      if (typeof loadBookOptions === 'function') loadBookOptions();
      if (typeof loadStats === 'function') loadStats();
    } else {
      alert(data.error || 'Failed to add book');
    }
  } catch (err) {
    console.error('Error adding book:', err);
  }
}

async function loadBooks() {
  const container = document.getElementById('books-list');
  if (!container) return;

  try {
    const res = await fetch(`${API}/books`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    const books = Array.isArray(data) ? data : (data.books && Array.isArray(data.books) ? data.books : null);

    if (!books) {
      container.innerHTML = `<p style="color: #dc2626; padding: 10px;"><b>Failed to load books:</b> ${data.error || data.message || 'Invalid server response'}</p>`;
      return;
    }

    if (books.length === 0) {
      container.innerHTML = '<p style="color: #64748b; padding: 10px;">No books available in database catalog.</p>';
      return;
    }

    container.innerHTML = `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.88rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left; color: #334155;">
              <th style="padding: 10px;">ID</th>
              <th style="padding: 10px;">Title</th>
              <th style="padding: 10px;">Author</th>
              <th style="padding: 10px;">ISBN</th>
              <th style="padding: 10px;">Genre</th>
              <th style="padding: 10px;">Available</th>
              <th style="padding: 10px;">Total Copies</th>
              <th style="padding: 10px; text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${books.map(b => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold; color: #475569;">#${b.book_id}</td>
                <td style="padding: 10px;"><b>${b.title}</b></td>
                <td style="padding: 10px;">${b.author}</td>
                <td style="padding: 10px;"><code>${b.isbn || 'N/A'}</code></td>
                <td style="padding: 10px;">${b.genre || 'Unassigned'}</td>
                <td style="padding: 10px;">
                  <span style="color: ${b.available_copies > 0 ? '#16a34a' : '#dc2626'}; font-weight: bold;">
                    ${b.available_copies}
                  </span>
                </td>
                <td style="padding: 10px;">${b.total_copies ?? b.available_copies}</td>
                <td style="padding: 10px; text-align: center;">
                  <button onclick="deleteBook(${b.book_id})" style="background:#dc2626; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem;">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error('Failed to load full book metadata:', err);
    container.innerHTML = `<p style="color: #dc2626; padding: 10px;"><b>Error:</b> Unable to connect to server or load catalog.</p>`;
  }
}

async function loadBookOptions() {
  try {
    const res = await fetch(`${API}/books`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const datalist = document.getElementById('available-books-list');

    if (!datalist) return;

    const books = Array.isArray(data) ? data : (data.books && Array.isArray(data.books) ? data.books : []);

    datalist.innerHTML = books
      .filter(b => b.available_copies > 0)
      .map(b => `<option value="${b.title}">${b.title} (Available: ${b.available_copies})</option>`)
      .join('');
  } catch (err) {
    console.error('Failed to load book options for dropdown:', err);
  }
}

async function deleteBook(id) {
  if (!confirm('Are you sure you want to delete this book?')) return;

  try {
    const res = await fetch(`${API}/books/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok) {
      alert('Book deleted successfully!');
      loadBooks();
      loadBookOptions();
      loadStats();
    } else {
      alert(data.error || 'Failed to delete book. Make sure there are no active issued copies for this book.');
    }
  } catch (err) {
    console.error('Error deleting book:', err);
    alert('Failed to delete book due to server error.');
  }
}

async function submitIssueBook() {
  const studentEmail = document.getElementById('issue-student-email').value.trim();
  const bookTitle = document.getElementById('issue-book-title').value.trim();

  if (!studentEmail || !bookTitle) {
    alert('Please enter both student email and select/type a book title');
    return;
  }

  try {
    const res = await fetch(`${API}/issues/issue`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ studentEmail, bookTitle })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      document.getElementById('issue-student-email').value = '';
      document.getElementById('issue-book-title').value = '';
      loadBookOptions(); // Refresh available dropdown list
      loadBooks();
      loadStats();
    } else {
      alert(data.error); // Displays error if student reached 5 books limit
    }
  } catch (err) {
    console.error('Failed to issue book', err);
  }
}

async function submitReturnById() {
  const issueId = document.getElementById('return-issue-id').value;
  if (!issueId) {
    alert('Please enter a valid Issue ID');
    return;
  }
  returnBook(issueId);
}

async function searchStudentIssues() {
  const search = document.getElementById('search-student-input').value.trim();
  if (!search) {
    alert('Please enter a student name or email to search.');
    return;
  }

  try {
    const res = await fetch(`${API}/issues/active-by-student?search=${encodeURIComponent(search)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const issues = await res.json();
    const container = document.getElementById('student-issues-results');

    if (!issues || issues.length === 0) {
      container.innerHTML = '<p>No active borrowed books found matching your search.</p>';
      return;
    }

    // Group active issues by user_id so identical names remain separate
    const studentMap = issues.reduce((acc, issue) => {
      if (!acc[issue.user_id]) {
        acc[issue.user_id] = {
          name: issue.student_name,
          email: issue.student_email,
          books: []
        };
      }
      acc[issue.user_id].books.push(issue);
      return acc;
    }, {});

    // Render separate boxes for each student
    container.innerHTML = Object.values(studentMap).map(student => `
      <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 6px; background: #fff;">
        <h3 style="margin-top: 0; color: #1e293b;">
          ${student.name} <span style="font-size: 0.85rem; font-weight: normal; color: #64748b;">(${student.email})</span>
        </h3>
        <ul style="padding-left: 20px; margin-bottom: 0;">
          ${student.books.map(i => `
            <li style="margin-bottom: 8px;">
              <b>"${i.title}"</b> (Issue ID: ${i.issue_id} | Due: ${new Date(i.due_date).toLocaleDateString()})
              <button onclick="returnBook(${i.issue_id})" style="margin-left: 10px;">Return This Book</button>
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');

  } catch (err) {
    console.error('Failed to search student issues', err);
  }
}

async function returnBook(issueId) {
  const res = await fetch(`${API}/issues/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ issue_id: parseInt(issueId) })
  });

  const data = await res.json();
  if (res.ok) {
    alert(`Book returned successfully! Fine calculated: $${data.fine}`);
    searchStudentIssues(); // Refresh current student list
    loadBooks();
    loadStats();
  } else {
    alert(data.error);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

loadStats();
loadBooks();
loadBookOptions();