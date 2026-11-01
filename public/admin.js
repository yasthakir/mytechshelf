const API_BASE = (window.MYTECHSHELF_API_URL || '') || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'https://mytechshelf.onrender.com');
const apiUrl = (path) => `${API_BASE}${path}`;

const totalBooks = document.getElementById('totalBooks');
const totalRevenue = document.getElementById('totalRevenue');
const totalOrders = document.getElementById('totalOrders');
const totalSold = document.getElementById('totalSold');
const bookInventory = document.getElementById('bookInventory');
const ordersTableBody = document.getElementById('ordersTableBody');
const addBookForm = document.getElementById('addBookForm');
const adminMessage = document.getElementById('adminMessage');

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

async function fetchDashboardData() {
  const [booksResponse, ordersResponse, statsResponse] = await Promise.all([
    fetch(apiUrl('/api/books')),
    fetch(apiUrl('/api/orders')),
    fetch(apiUrl('/api/stats'))
  ]);

  const books = await booksResponse.json();
  const orders = await ordersResponse.json();
  const stats = await statsResponse.json();

  totalBooks.textContent = String(books.length);
  totalRevenue.textContent = money(stats.totalRevenue);
  totalOrders.textContent = String(stats.totalOrders);
  totalSold.textContent = String(stats.soldCopies);

  bookInventory.innerHTML = books
    .map(
      (book) => `
        <div class="inventory-item">
          <div>
            <div class="inventory-name">${book.title}</div>
            <div class="inventory-meta">${book.category} • ${money(book.price)}</div>
          </div>
          <span class="category-tag">${book.stock || 25} left</span>
        </div>
      `
    )
    .join('');

  ordersTableBody.innerHTML = orders.length
    ? orders
        .map(
          (order) => `
            <tr>
              <td>${order.id}</td>
              <td>${order.bookTitle}</td>
              <td>${order.customer?.name || 'N/A'}</td>
              <td>${order.customer?.whatsapp || 'N/A'}</td>
              <td>${order.deliveryType || 'soft copy'}</td>
              <td>${money(order.amount)}</td>
              <td>${formatDate(order.createdAt)}</td>
            </tr>
          `
        )
        .join('')
    : '<tr><td colspan="7">No orders yet.</td></tr>';
}

addBookForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  adminMessage.textContent = 'Adding book...';

  const formData = new FormData(addBookForm);

  try {
    const response = await fetch(apiUrl('/api/books'), {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to add this book.');
    }

    adminMessage.textContent = result.message || 'Book added successfully.';
    addBookForm.reset();
    await fetchDashboardData();
  } catch (error) {
    adminMessage.textContent = error.message;
    adminMessage.style.color = '#fca5a5';
  }
});

fetchDashboardData();
