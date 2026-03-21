const http = require('http');
fetch('http://localhost:8081/api/v1/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username: 'admin', password: 'admin123'})
}).then(r => r.json()).then(d => {
  console.log("Token:", d.token.substring(0, 10) + "...");
  return fetch('http://localhost:8080/api/v1/system/monitoring/summary', {
    headers: { 'Authorization': 'Bearer ' + d.token }
  });
}).then(r => r.json()).then(data => {
  console.log("Summary:", JSON.stringify(data).substring(0, 200));
}).catch(console.error);
