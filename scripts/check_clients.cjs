const http = require('http');
http.get('http://localhost:5173/api/clients', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const b = JSON.parse(d);
    console.log('件数:', b.count);
    b.clients.forEach(c => console.log(c.threeCode, c.companyName, c.status));
  });
});
