// バックエンド直接（port 8080）
fetch('http://localhost:8080/api/activity-log/summary')
  .then(r => {
    console.log('status:', r.status);
    return r.text();
  })
  .then(t => console.log('body:', t.slice(0, 300)))
  .catch(e => console.error(e));
