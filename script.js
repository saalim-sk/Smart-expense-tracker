// Expense Tracker demo: browser-local storage (not a production authentication system).
if (!sessionStorage.getItem('expenseTrackerUser')) {
  window.location.replace('index.html');
}
const user = sessionStorage.getItem('expenseTrackerUser') || 'admin';
document.getElementById('welcomeUser').textContent = 'Hi, ' + user;
document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
document.getElementById('date').value = new Date().toISOString().slice(0,10);

const STORAGE_KEY = 'expenseTrackerTransactions';
let transactions = [];
try { transactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { transactions = []; }
const money = n => new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'}).format(n);
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));

function render() {
  const income = transactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
  document.getElementById('incomeTotal').textContent = money(income);
  document.getElementById('expenseTotal').textContent = money(expense);
  document.getElementById('balanceTotal').textContent = money(income - expense);
  renderRows();
  renderBreakdown();
}
function renderRows() {
  const tbody = document.getElementById('transactionRows');
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const visible = transactions.filter(t => [t.title,t.category,t.type,t.date].join(' ').toLowerCase().includes(query)).slice().sort((a,b) => b.date.localeCompare(a.date));
  if (!visible.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${transactions.length ? 'No matching transactions found.' : 'No transactions yet. Add one above to get started.'}</td></tr>`;
    return;
  }
  tbody.innerHTML = visible.map(t => `<tr>
    <td><strong>${escapeHTML(t.title)}</strong></td><td>${escapeHTML(t.category)}</td>
    <td>${new Date(t.date+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
    <td><span class="type-pill ${t.type}">${t.type === 'income' ? 'Income' : 'Expense'}</span></td>
    <td class="right amount-cell ${t.type === 'income' ? 'positive' : 'negative'}">${t.type === 'income' ? '+' : '−'}${money(t.amount)}</td>
    <td class="right"><button class="delete-btn" data-delete="${t.id}" aria-label="Delete ${escapeHTML(t.title)}">Delete</button></td>
  </tr>`).join('');
}
function renderBreakdown() {
  const el = document.getElementById('categoryBreakdown');
  const expenses = transactions.filter(t => t.type === 'expense');
  const total = expenses.reduce((s,t) => s+t.amount, 0);
  const groups = {};
  expenses.forEach(t => groups[t.category] = (groups[t.category] || 0) + t.amount);
  const sorted = Object.entries(groups).sort((a,b) => b[1]-a[1]).slice(0,5);
  if (!sorted.length) { el.innerHTML = '<p class="muted">Add an expense to see your spending.</p>'; return; }
  el.innerHTML = sorted.map(([name, amount]) => `<div class="breakdown-row"><div class="breakdown-label"><span>${escapeHTML(name)}</span><strong>${money(amount)}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, amount/total*100)}%"></div></div></div>`).join('');
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
document.getElementById('transactionForm').addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const amount = Number(document.getElementById('amount').value);
  const date = document.getElementById('date').value;
  if (!title || !Number.isFinite(amount) || amount <= 0 || !date) {
    document.getElementById('formMessage').textContent = 'Please enter a description, valid amount, and date.';
    return;
  }
  transactions.push({id: (Date.now().toString(36) + Math.random().toString(36).slice(2,7)), type: document.getElementById('type').value, title, amount, category: document.getElementById('category').value, date});
  save();
  e.target.reset();
  document.getElementById('date').value = new Date().toISOString().slice(0,10);
  document.getElementById('formMessage').textContent = 'Transaction added successfully.';
  render();
});
document.getElementById('transactionRows').addEventListener('click', e => {
  const btn = e.target.closest('[data-delete]');
  if (!btn) return;
  transactions = transactions.filter(t => t.id !== btn.dataset.delete);
  save();
  render();
});
document.getElementById('searchInput').addEventListener('input', renderRows);
document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('expenseTrackerUser');
  window.location.href = 'index.html';
});
render();
