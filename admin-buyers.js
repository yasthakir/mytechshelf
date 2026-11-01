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
  const response = await fetch('/api/orders', {
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
              <td>${formatDate(order.createdAt)}</td>
            </tr>
          `
        )
        .join('')
    : '<tr><td colspan="10">No buyer information yet.</td></tr>';

  buyersTableBody.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', async (event) => {
      const token = localStorage.getItem('coderslab_token');
      const response = await fetch(`/api/orders/${event.target.dataset.id}/sent-pdf`, {
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

loadBuyers();
