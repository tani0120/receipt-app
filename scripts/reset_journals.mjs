// サーバーのインメモリキャッシュ+JSONを空にする
const ids = ['TST-00011','ABC-00001','ABC-00011','ANE-00006','MHL-00009','MNO-00005','ORD-00007','undefined'];

async function reset() {
  for (const id of ids) {
    const r = await fetch(`http://localhost:5173/api/journals/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ journals: [] }),
    });
    console.log(`${id}: ${r.status}`);
  }
  console.log('全社リセット完了');
}
reset();
