const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login to backend...\n');

    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    console.log('\nToken received:', response.data.accessToken ? 'YES' : 'NO');
  } catch (error) {
    console.log('❌ Login failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testLogin();
