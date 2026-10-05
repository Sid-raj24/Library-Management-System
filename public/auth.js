const API = 'http://localhost:5000/api';

function switchView(view) {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('register-view').classList.add('hidden');
  document.getElementById('forgot-view').classList.add('hidden');

  if (view === 'register') document.getElementById('register-view').classList.remove('hidden');
  else if (view === 'forgot') document.getElementById('forgot-view').classList.remove('hidden');
  else document.getElementById('login-view').classList.remove('hidden');
}

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('name', data.user.name);

    // Redirect to designated dashboard based on user role
    if (data.user.role === 'admin' || data.user.role === 'librarian') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'student.html';
    }
  } else {
    alert(data.error);
  }
}

async function register() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role: 'student' })
  });

  if (res.ok) {
    alert('Registration successful! Please log in.');
    switchView('login');
  } else {
    const data = await res.json();
    alert(data.error);
  }
}

async function requestOtp() {
  const email = document.getElementById('forgot-email').value;
  const res = await fetch(`${API}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (res.ok) {
    alert(data.message);
    document.getElementById('step-email').classList.add('hidden');
    document.getElementById('step-otp').classList.remove('hidden');
  } else {
    alert(data.error); // Will alert "Email is not registered" if invalid
  }
}

async function verifyOtp() {
  const email = document.getElementById('forgot-email').value;
  const otp = document.getElementById('reset-otp').value;
  
  const res = await fetch(`${API}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });

  if (res.ok) {
    document.getElementById('step-otp').classList.add('hidden');
    document.getElementById('step-new-password').classList.remove('hidden');
  } else {
    const data = await res.json();
    alert(data.error);
  }
}

async function submitNewPassword() {
  const email = document.getElementById('forgot-email').value;
  const otp = document.getElementById('reset-otp').value;
  const newPassword = document.getElementById('new-password').value;

  const res = await fetch(`${API}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword })
  });

  if (res.ok) {
    alert('Password reset successfully! You can log in now.');
    window.location.reload();
  } else {
    const data = await res.json();
    alert(data.error);
  }
}