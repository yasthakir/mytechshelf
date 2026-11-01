const API_BASE = (window.MYTECHSHELF_API_URL || '') || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'https://mytechshelf.onrender.com');
const apiUrl = (path) => `${API_BASE}${path}`;

const totalBooks = document.getElementById('totalBooks');
const totalRevenue = document.getElementById('totalRevenue');
const totalOrders = document.getElementById('totalOrders');
const totalBuyers = document.getElementById('totalBuyers');
const booksTableBody = document.getElementById('booksTableBody');
const ordersTableBody = document.getElementById('ordersTableBody');
const logoutBtn = document.querySelector('.admin-logout');

function ensureSession() {
  const token = localStorage.getItem('coderslab_token');
  if (!token) {
    window.location.href = '/admin';
    return false;
  }
  return true;
}

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

async function deleteBookFromDashboard(bookId) {
  const confirmed = window.confirm('Delete this book from the catalog?');
  if (!confirmed) return;

  const token = localStorage.getItem('coderslab_token');
  const response = await fetch(apiUrl(`/api/books/${bookId}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    window.alert('Unable to delete this book right now.');
    return;
  }

  fetchDashboardData();
}

async function fetchDashboardData() {
  if (!ensureSession()) return;

  const token = localStorage.getItem('coderslab_token');
  const [booksResponse, ordersResponse, statsResponse] = await Promise.all([
    fetch(apiUrl('/api/books'), {
      headers: { Authorization: `Bearer ${token}` }
    }),
    fetch(apiUrl('/api/orders'), {
      headers: { Authorization: `Bearer ${token}` }
    }),
    fetch(apiUrl('/api/stats'), {
      headers: { Authorization: `Bearer ${token}` }
    })
  ]);

  if (!booksResponse.ok || !ordersResponse.ok || !statsResponse.ok) {
    localStorage.removeItem('coderslab_token');
    localStorage.removeItem('coderslab_user');
    window.location.href = '/admin';
    return;
  }

  const books = await booksResponse.json();
  const orders = await ordersResponse.json();
  const stats = await statsResponse.json();

  totalBooks.textContent = String(books.length);
  totalRevenue.textContent = money(stats.totalRevenue);
  totalOrders.textContent = String(stats.totalOrders);
  totalBuyers.textContent = String(new Set((orders || []).map((order) => order.customer?.email || order.customer?.whatsapp || 'anon').filter(Boolean)).size);

  booksTableBody.innerHTML = books.length
    ? books
        .map(
          (book) => `
            <tr>
              <td>${book.title}</td>
              <td>${book.category || 'General'}</td>
              <td>${money(book.price)}</td>
              <td>${book.stock || 25}</td>
              <td><button type="button" class="delete-book-btn" data-id="${book.id}">Delete</button></td>
            </tr>
          `
        )
        .join('')
    : '<tr><td colspan="5">No books yet.</td></tr>';

  booksTableBody.querySelectorAll('.delete-book-btn').forEach((button) => {
    button.addEventListener('click', () => deleteBookFromDashboard(button.dataset.id));
  });

  ordersTableBody.innerHTML = orders.length
    ? orders
        .map(
          (order) => `
            <tr>
              <td>${order.id}</td>
              <td>${order.bookTitle || '—'}</td>
              <td>${order.customer?.name || 'N/A'}</td>
              <td>${order.customer?.email || 'N/A'}</td>
              <td>${order.customer?.whatsapp || 'N/A'}</td>
              <td>${order.deliveryType || 'soft copy'}</td>
              <td>${money(order.amount)}</td>
              <td>${order.paymentStatus || 'Pending'}</td>
              <td>
                <label class="sent-pdf-toggle">
                  <input type="checkbox" data-id="${order.id}" ${order.sentPdf ? 'checked' : ''} />
                </label>
              </td>
              <td>${order.screenshot ? `<a href="${order.screenshot}" target="_blank" rel="noreferrer"><img src="${order.screenshot}" alt="Payment proof" class="admin-proof-thumb" /></a>` : '—'}</td>
              <td>${formatDate(order.createdAt)}</td>
            </tr>
          `
        )
        .join('')
    : '<tr><td colspan="11">No orders yet.</td></tr>';

  ordersTableBody.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', async (event) => {
      const token = localStorage.getItem('coderslab_token');
      const response = await fetch(apiUrl(`/api/orders/${event.target.dataset.id}/sent-pdf`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sentPdf: event.target.checked })
      });

      if (!response.ok) {
        event.target.checked = !event.target.checked;
        window.alert('Unable to update PDF status.');
      }
    });
  });
}

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('coderslab_token');
  localStorage.removeItem('coderslab_user');
  window.location.href = '/admin';
});

fetchDashboardData();
