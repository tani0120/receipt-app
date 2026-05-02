const http = require('http');
http.get('http://localhost:5173/api/staff', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const b = JSON.parse(d);
    console.log('件数:', b.count);
    b.staff.forEach(s => console.log(s.uuid, s.name, s.status, s.role));
  });
});
