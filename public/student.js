const API = 'http://localhost:5000/api';
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

// Security Guard: Redirect if not logged in as student
if (!token || role !== 'student') {
  window.location.href = 'index.html';
}

document.getElementById('welcome').innerText = `Welcome, ${localStorage.getItem('name')}`;

async function loadStudentStats() {
  try {
    const res = await fetch(`${API}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const metrics = data.metrics || {};

    document.getElementById('student-stats').innerHTML = `
      <div class="stats-container">
        <div class="stat-box">
          <span class="stat-number">${metrics.active_issues || 0}</span>
          <span class="stat-label">Currently Borrowed</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">${metrics.total_issued || 0}</span>
          <span class="stat-label">Total Books Issued</span>
        </div>
        <div class="stat-box ${metrics.unpaid_fines > 0 ? 'warning' : ''}">
          <span class="stat-number">$${parseFloat(metrics.unpaid_fines || 0).toFixed(2)}</span>
          <span class="stat-label">Unpaid Fines</span>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Failed to load student metrics', err);
    document.getElementById('student-stats').innerHTML = '<p>Unable to load account stats.</p>';
  }
}

async function loadCatalog() {
  try {
    const res = await fetch(`${API}/books`);
    const books = await res.json();
    
    // Read-only view: Display stock status instead of a Borrow button
    document.getElementById('catalog-list').innerHTML = books.map(b => {
      const statusTag = b.available_copies > 0 
        ? `<span style="color: green; font-weight: bold;">(Available: ${b.available_copies})</span>` 
        : `<span style="color: red;">(Out of stock)</span>`;
      return `<li><b>${b.title}</b> by ${b.author} ${statusTag}</li>`;
    }).join('');
  } catch (err) {
    console.error('Failed to load catalog:', err);
  }
}

async function loadMyHistory() {
  try {
    const res = await fetch(`${API}/issues/my-books`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const history = await res.json();
    
    document.getElementById('my-history').innerHTML = history.map(i => 
      `<li><b>${i.title}</b> - Status: <i>${i.status}</i> (Due: ${new Date(i.due_date).toLocaleDateString()})</li>`
    ).join('');
  } catch (err) {
    console.error('Failed to load history:', err);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// Page Initialization
loadStudentStats();
loadCatalog();
loadMyHistory();