const API = 'http://localhost:4000';
let token = '';

const el = s => document.querySelector(s);

document.getElementById('loginBtn').onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const res = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    document.getElementById('authStatus').textContent = 'Logged in';
    loadAll();
  } else {
    document.getElementById('authStatus').textContent = data.error || 'Login failed';
  }
};

document.getElementById('addBtn').onclick = async () => {
  const amount = document.getElementById('amount').value;
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  await fetch(API + '/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ amount, category, date })
  });
  await loadAll();
  document.getElementById('amount').value = ''; 
  document.getElementById('category').value=''; 
  document.getElementById('date').value='';
};

let chart;
async function loadAll(){
  const txns = await (await fetch(API + '/transactions', { headers: { Authorization: 'Bearer ' + token } })).json();
  const list = document.getElementById('list');
  list.innerHTML = '';
  txns.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${t.date} — ${t.category}</span><strong>$${Number(t.amount).toFixed(2)}</strong>`;
    list.appendChild(li);
  });
  const insights = await (await fetch(API + '/insights', { headers: { Authorization: 'Bearer ' + token } })).json();
  document.getElementById('insights').textContent = insights.tip;

  const labels = Object.keys(insights.byCategory || {});
  const values = Object.values(insights.byCategory || {});
  const ctx = document.getElementById('chart');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Spending', data: values }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}
