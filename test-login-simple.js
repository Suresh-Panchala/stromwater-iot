const https = require('http');

const postData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

console.log('Testing login to backend...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('✅ Login successful!');
      const response = JSON.parse(data);
      console.log('User:', response.user.username);
      console.log('Role:', response.user.role);
      console.log('Token received:', response.accessToken ? 'YES' : 'NO');
    } else {
      console.log('❌ Login failed!');
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Connection error!');
  console.log('Error:', error.message);
  console.log('\nIs the backend running? Check if start-backend.bat is running.');
});

req.write(postData);
req.end();
