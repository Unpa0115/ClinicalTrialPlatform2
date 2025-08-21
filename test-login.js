const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin@example.com',
        password: 'TempPass123!'
      })
    });

    const data = await response.json();
    console.log('Login response:', data);
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Username:', data.user?.username);
      console.log('Role:', data.user?.role);
    } else {
      console.log('❌ Login failed:', data.error || data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testLogin();