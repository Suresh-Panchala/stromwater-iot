const http = require('http');

// This script will call a special admin reset endpoint on your backend
// First, we need to create this endpoint on the VPS

const VPS_IP = '43.205.194.142';

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   StromWater Admin Reset (Remote)                     ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('⚠️  SSH authentication failed.');
console.log('⚠️  You need to either:');
console.log('');
console.log('Option 1: Set up SSH key authentication');
console.log('─────────────────────────────────────────');
console.log('1. Generate SSH key (if you don\'t have one):');
console.log('   ssh-keygen -t rsa -b 4096');
console.log('');
console.log('2. Copy your public key to VPS:');
console.log('   type %USERPROFILE%\\.ssh\\id_rsa.pub | ssh ubuntu@43.205.194.142 "cat >> ~/.ssh/authorized_keys"');
console.log('');
console.log('Option 2: Use password authentication');
console.log('─────────────────────────────────────────');
console.log('1. Connect to VPS using PuTTY or password-based SSH');
console.log('2. Run these commands manually:');
console.log('');
console.log('   cd /var/www/stromwater/backend');
console.log('   node src/scripts/initDatabase.js');
console.log('   pm2 restart stromwater-backend');
console.log('');
console.log('Option 3: Create a temporary admin reset endpoint');
console.log('─────────────────────────────────────────');
console.log('This requires you to manually add code to the backend.');
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('Testing current login status...');

const postData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const options = {
  hostname: VPS_IP,
  port: 80,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nLogin Response:');
    console.log('─'.repeat(60));

    try {
      const response = JSON.parse(data);

      if (response.token) {
        console.log('✓ LOGIN SUCCESSFUL!');
        console.log('✓ Token received:', response.token.substring(0, 30) + '...');
        console.log('\nYou can now login to the dashboard at:');
        console.log(`http://${VPS_IP}`);
      } else if (response.error) {
        console.log('✗ LOGIN FAILED:', response.error);
        console.log('\n⚠️  You need to access the VPS directly to reset admin user.');
        console.log('\nManual steps:');
        console.log('1. Connect to VPS using your cloud provider\'s web console');
        console.log('2. Run: cd /var/www/stromwater/backend');
        console.log('3. Run: node src/scripts/initDatabase.js');
        console.log('4. Run: pm2 restart stromwater-backend');
        console.log('5. Try login again');
      }
    } catch (e) {
      console.log('Raw response:', data);
    }

    console.log('─'.repeat(60));
  });
});

req.on('error', (e) => {
  console.error('✗ Request failed:', e.message);
});

req.write(postData);
req.end();
