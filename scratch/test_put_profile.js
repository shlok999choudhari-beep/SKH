const http = require('http');

const data = JSON.stringify({
  cgpa: 8.5,
  tenth_marks: 85,
  twelfth_marks: 88
});

const req = http.request('http://localhost:3000/api/student/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', body);
  });
});

req.on('error', err => console.error('Request Error:', err));
req.write(data);
req.end();
