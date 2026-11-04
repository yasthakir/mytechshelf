const API_BASE = (window.MYTECHSHELF_API_URL || '') || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'https://mytechshelf-backend.onrender.com');
const apiUrl = (path) => `${API_BASE}${path}`;

const buyersTableBody = document.getElementById('buyersTableBody');
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

async function loadBuyers() {
  if (!ensureSession()) return;

  const token = localStorage.getItem('coderslab_token');
  const response = await fetch(apiUrl('/api/orders'), {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    localStorage.removeItem('coderslab_token');
    localStorage.removeItem('coderslab_user');
    window.location.href = '/admin';
    return;
  }

  const orders = await response.json();

  buyersTableBody.innerHTML = orders.length
    ? orders
        .map(
          (order) => `
            <tr>
              <td>${order.customer?.name || 'N/A'}</td>
              <td>${order.customer?.email || 'N/A'}</td>
              <td>${order.customer?.whatsapp || 'N/A'}</td>
              <td>${order.bookTitle || '—'}</td>
              <td>${order.deliveryType || 'soft copy'}</td>
              <td>${money(order.amount)}</td>
              <td>${order.paymentStatus || 'Pending'}</td>
              <td>
                <label class="sent-pdf-toggle">
                  <input type="checkbox" data-id="${order.id}" ${order.sentPdf ? 'checked' : ''} />
                </label>
              </td>
              <td>${order.screenshot ? `<a href="${order.screenshot}" target="_blank" rel="noreferrer"><img src="${order.screenshot}" alt="Payment receipt" class="admin-proof-thumb" /></a>` : '—'}</td>
              <td><button type="button" class="receipt-btn" data-order='${JSON.stringify(order).replace(/'/g, '&apos;')}'>Generate receipt</button></td>
              <td>${formatDate(order.createdAt)}</td>
            </tr>
          `
        )
        .join('')
    : '<tr><td colspan="10">No buyer information yet.</td></tr>';

  buyersTableBody.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
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

  buyersTableBody.querySelectorAll('.receipt-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const order = JSON.parse(button.dataset.order.replace(/&apos;/g, "'"));
      const receiptWindow = window.open('', '_blank', 'width=800,height=700');
      const receiptHtml = `
        <html>
          <head><title>MyTechShelf Receipt</title></head>
          <body style="font-family: Arial, sans-serif; padding: 24px; color: #111827;">
            <h2>MyTechShelf Receipt</h2>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Customer:</strong> ${order.customer?.name || 'N/A'}</p>
            <p><strong>Email:</strong> ${order.customer?.email || 'N/A'}</p>
            <p><strong>WhatsApp:</strong> ${order.customer?.whatsapp || 'N/A'}</p>
            <p><strong>Book:</strong> ${order.bookTitle || 'N/A'}</p>
            <p><strong>Amount:</strong> ${money(order.amount)}</p>
            <p><strong>Payment:</strong> ${order.paymentStatus || 'Pending'}</p>
            <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
            <hr />
            <p>Thank you for shopping with MyTechShelf.</p>
          </body>
        </html>
      `;
      receiptWindow.document.write(receiptHtml);
      receiptWindow.document.close();
    });
  });
}

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('coderslab_token');
  localStorage.removeItem('coderslab_user');
  window.location.href = '/admin';
});

loadBuyers();
