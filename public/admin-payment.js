const API_BASE = (window.MYTECHSHELF_API_URL || '') || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'https://mytechshelf.onrender.com');
const apiUrl = (path) => `${API_BASE}${path}`;

const paymentForm = document.getElementById('paymentForm');
const paymentMessage = document.getElementById('paymentMessage');
const paymentQrPreview = document.getElementById('paymentQrPreview');
const paymentPreviewText = document.getElementById('paymentPreviewText');
const logoutBtn = document.querySelector('.admin-logout');

function ensureSession() {
  const token = localStorage.getItem('coderslab_token');
  if (!token) {
    window.location.href = '/admin';
    return false;
  }
  return true;
}

async function loadPaymentSettings() {
  if (!ensureSession()) return;

  const token = localStorage.getItem('coderslab_token');
  const response = await fetch(apiUrl('/api/payment-settings'), {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    localStorage.removeItem('coderslab_token');
    localStorage.removeItem('coderslab_user');
    window.location.href = '/admin';
    return;
  }

  const settings = await response.json();
  paymentForm.querySelector('[name="upiId"]').value = settings?.upiId || 'coderslab@upi';
  paymentForm.querySelector('[name="merchantName"]').value = settings?.merchantName || 'CodersLab';
  paymentForm.querySelector('[name="note"]').value = settings?.note || 'Scan and pay using any UPI app.';

  if (settings?.qrImage) {
    paymentQrPreview.src = settings.qrImage;
    paymentPreviewText.textContent = 'Current QR image';
  } else {
    paymentQrPreview.src = '';
    paymentPreviewText.textContent = 'No QR uploaded yet.';
  }
}

paymentForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!ensureSession()) return;

  const token = localStorage.getItem('coderslab_token');
  const formData = new FormData(paymentForm);

  paymentMessage.textContent = 'Saving payment settings...';

  try {
    const response = await fetch(apiUrl('/api/payment-settings'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to save payment setting.');
    }

    paymentMessage.textContent = result.message || 'Payment settings updated.';
    if (result.paymentSettings?.qrImage) {
      paymentQrPreview.src = result.paymentSettings.qrImage;
      paymentPreviewText.textContent = 'Saved QR image';
    }
  } catch (error) {
    paymentMessage.textContent = error.message;
  }
});

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('coderslab_token');
  localStorage.removeItem('coderslab_user');
  window.location.href = '/admin';
});

loadPaymentSettings();
