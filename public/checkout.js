const API_BASE = (window.MYTECHSHELF_API_URL || '') || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'https://mytechshelf.onrender.com');
const apiUrl = (path) => `${API_BASE}${path}`;

const checkoutSummary = document.getElementById('checkoutSummary');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutMessage = document.getElementById('checkoutMessage');
const paymentModal = document.getElementById('paymentModal');
const paymentTotalLabel = document.getElementById('paymentTotalLabel');
const checkoutQrImage = document.getElementById('checkoutQrImage');
const paymentForm = document.getElementById('paymentForm');
const paymentModalMessage = document.getElementById('paymentModalMessage');
const paidCheckbox = document.getElementById('paidCheckbox');
const paymentScreenshot = document.getElementById('paymentScreenshot');
const checkoutBookId = document.getElementById('checkoutBookId');
const checkoutAmount = document.getElementById('checkoutAmount');
const checkoutCustomerName = document.getElementById('checkoutCustomerName');
const checkoutCustomerEmail = document.getElementById('checkoutCustomerEmail');
const checkoutCustomerPhone = document.getElementById('checkoutCustomerPhone');
const checkoutCustomerAddress = document.getElementById('checkoutCustomerAddress');
const checkoutPaymentStatus = document.getElementById('checkoutPaymentStatus');

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (error) {
    return [];
  }
}

function renderSummary() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);

  checkoutSummary.innerHTML = cart.length
    ? `
      <div class="cart-items">
        ${cart
          .map(
            (item) => `
              <div class="cart-item">
                <div>
                  <h4>${item.title}</h4>
                  <small>${item.quantity || 1} item(s)</small>
                </div>
                <strong>${money((item.price || 0) * (item.quantity || 1))}</strong>
              </div>
            `
          )
          .join('')}
      </div>
      <div class="summary-row"><span>Subtotal</span><strong>${money(total)}</strong></div>
      <div class="summary-row"><span>Delivery</span><strong>Free</strong></div>
      <div class="summary-row total"><span>Total</span><strong>${money(total)}</strong></div>
    `
    : '<div class="empty-state">Your cart is empty. Add books before checkout.</div>';
}

async function openPaymentModal() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);
  const firstItem = cart[0];

  paymentTotalLabel.textContent = money(total);
  checkoutBookId.value = firstItem ? firstItem.id : '';
  checkoutAmount.value = String(total);
  checkoutPaymentStatus.value = 'Pending';
  paymentModal.classList.remove('hidden');
  paymentModal.setAttribute('aria-hidden', 'false');

  const qrResponse = await fetch(apiUrl(`/api/qr?amount=${total}`));
  const qrData = await qrResponse.json();
  checkoutQrImage.src = qrData.qrDataUrl;
}

function closePaymentModal() {
  paymentModal.classList.add('hidden');
  paymentModal.setAttribute('aria-hidden', 'true');
  paymentForm.reset();
  paidCheckbox.checked = false;
  checkoutPaymentStatus.value = 'Pending';
  paymentModalMessage.textContent = '';
  paymentScreenshot.value = '';
}

checkoutForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const cart = getCart();

  if (!cart.length) {
    checkoutMessage.textContent = 'Your cart is empty.';
    return;
  }

  const formData = new FormData(checkoutForm);
  const customerName = String(formData.get('name') || '').trim();
  const customerEmail = String(formData.get('email') || '').trim();
  const customerPhone = String(formData.get('phone') || '').trim();
  const customerAddress = String(formData.get('address') || '').trim();

  if (!customerName || !customerEmail || !customerPhone || !customerAddress) {
    checkoutMessage.textContent = 'Please fill in all checkout details.';
    return;
  }

  checkoutCustomerName.value = customerName;
  checkoutCustomerEmail.value = customerEmail;
  checkoutCustomerPhone.value = customerPhone;
  checkoutCustomerAddress.value = customerAddress;

  const orderData = {
    customer: Object.fromEntries(formData.entries()),
    items: cart,
    total: cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0),
    createdAt: new Date().toISOString()
  };

  localStorage.setItem('lastOrder', JSON.stringify(orderData));
  checkoutMessage.textContent = 'Please complete payment below to confirm your order.';
  checkoutForm.reset();
  openPaymentModal();
});

paymentForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const cart = getCart();

  if (!cart.length) {
    paymentModalMessage.textContent = 'Your cart is empty.';
    return;
  }

  const formData = new FormData(paymentForm);
  const paymentChecked = paidCheckbox.checked;

  if (!paymentChecked) {
    paymentModalMessage.textContent = 'Please tick the Paid box after making the payment.';
    return;
  }

  if (!formData.get('screenshot') || !formData.get('screenshot').name) {
    paymentModalMessage.textContent = 'Please upload the payment screenshot before submitting.';
    return;
  }

  formData.append('bookId', checkoutBookId.value || cart[0].id);
  formData.append('paymentStatus', 'Paid');
  formData.append('name', checkoutCustomerName.value);
  formData.append('email', checkoutCustomerEmail.value);
  formData.append('whatsapp', checkoutCustomerPhone.value);
  formData.append('address', checkoutCustomerAddress.value);

  try {
    paymentModalMessage.textContent = 'Submitting your order and payment proof...';
    const response = await fetch(apiUrl('/api/orders'), {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to submit your order.');
    }

    localStorage.removeItem('cart');
    closePaymentModal();
    checkoutMessage.textContent = 'Order submitted successfully. We will send the PDF within 10–15 minutes. If not received, contact us at info@mytechshelf.in';
    renderSummary();
  } catch (error) {
    paymentModalMessage.textContent = error.message;
    paymentModalMessage.style.color = '#fca5a5';
  }
});

paidCheckbox?.addEventListener('change', () => {
  checkoutPaymentStatus.value = paidCheckbox.checked ? 'Paid' : 'Pending';
  paymentModalMessage.textContent = paidCheckbox.checked
    ? 'Payment proof is ready to upload.'
    : 'Please tick Paid after making the payment.';
});

document.querySelector('[data-close="true"]')?.addEventListener('click', closePaymentModal);
document.querySelector('.modal-close')?.addEventListener('click', closePaymentModal);

renderSummary();
