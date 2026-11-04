const checkoutSummary = document.getElementById('checkoutSummary');
const checkoutForm = document.getElementById('checkoutForm');
const paymentForm = document.getElementById('paymentForm');
const paymentStep = document.getElementById('paymentStep');
const qrPaymentBox = document.getElementById('qrPaymentBox');
const checkoutMessage = document.getElementById('checkoutMessage');
const continueToUploadBtn = document.getElementById('continueToUploadBtn');

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

function getOrderSnapshot() {
  try {
    return JSON.parse(localStorage.getItem('pendingOrder') || 'null');
  } catch (error) {
    return null;
  }
}

async function renderSummary() {
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

  if (!cart.length) {
    qrPaymentBox.innerHTML = '<div class="empty-state">Add books to view payment details.</div>';
    return;
  }

  try {
    const response = await fetch(`/api/qr?amount=${total}`);
    const data = await response.json();
    const qrSrc = data.qrDataUrl || '';

    qrPaymentBox.innerHTML = `
      <div class="payment-qr-card">
        <p>Scan to pay</p>
        <div class="qr-code-box">
          ${qrSrc ? `<img src="${qrSrc}" alt="UPI QR code" style="width: 180px; height: 180px; object-fit: contain; border-radius: 14px; background: #fff; padding: 12px;" />` : 'UPI QR'}
        </div>
        <small>${money(total)} total</small>
        <p class="upi-code">UPI: ${data.upi || 'coderslab@upi'}</p>
        <p class="upi-code">Pay using any UPI app</p>
      </div>
    `;
  } catch (error) {
    const qrText = `upi://pay?pa=coderslab@upi&pn=MyTechShelf&am=${total}&cu=INR`;
    qrPaymentBox.innerHTML = `
      <div class="payment-qr-card">
        <p>Scan to pay</p>
        <div class="qr-code-box">UPI QR</div>
        <small>${money(total)} total</small>
        <p class="upi-code">UPI: coderslab@upi</p>
        <p class="upi-code">Pay using any UPI app</p>
      </div>
    `;
    qrPaymentBox.dataset.qrText = qrText;
  }
}

checkoutForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const cart = getCart();

  if (!cart.length) {
    checkoutMessage.textContent = 'Your cart is empty.';
    return;
  }

  const formData = new FormData(checkoutForm);
  const customer = Object.fromEntries(formData.entries());
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);
  const pendingOrder = {
    customer,
    items: cart,
    total,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem('pendingOrder', JSON.stringify(pendingOrder));
  checkoutForm.hidden = true;
  paymentStep.hidden = false;
  checkoutMessage.textContent = 'Order placed successfully. Please continue to payment and upload your screenshot.';
  checkoutForm.reset();
  renderSummary();
});

continueToUploadBtn?.addEventListener('click', () => {
  paymentForm.hidden = false;
  continueToUploadBtn.hidden = true;
  checkoutMessage.textContent = 'Upload the payment screenshot and submit to complete your order.';
});

paymentForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const cart = getCart();
  const pendingOrder = getOrderSnapshot();

  if (!cart.length || !pendingOrder) {
    checkoutMessage.textContent = 'Please complete the checkout details first.';
    return;
  }

  const paymentFile = paymentForm.elements.screenshot?.files?.[0];
  if (!paymentFile) {
    checkoutMessage.textContent = 'Please upload the payment screenshot before submitting.';
    return;
  }

  checkoutMessage.textContent = 'Submitting your order and payment proof...';

  const formData = new FormData();
  const firstBook = cart[0];
  formData.append('bookId', String(firstBook.id || 'book-unknown'));
  formData.append('name', String(pendingOrder.customer.name || ''));
  formData.append('email', String(pendingOrder.customer.email || ''));
  formData.append('whatsapp', String(pendingOrder.customer.phone || pendingOrder.customer.whatsapp || ''));
  formData.append('address', String(pendingOrder.customer.address || ''));
  formData.append('deliveryType', 'soft copy');
  formData.append('amount', String(pendingOrder.total));
  formData.append('paymentStatus', 'Paid');
  formData.append('screenshot', paymentFile);

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Order submission failed.');

    localStorage.removeItem('cart');
    localStorage.removeItem('pendingOrder');
    paymentForm.reset();

    checkoutMessage.textContent = `${result.message || 'Order submitted successfully.'} If you do not receive the ebook within 1–2 hours, contact MyTechShelf on Instagram @mytechshelf.`;
    paymentStep.hidden = true;
    checkoutForm.hidden = false;

    const modalText = 'Your payment proof was submitted successfully. If you do not receive the ebook within 1–2 hours, contact MyTechShelf on Instagram @mytechshelf.';
    if (window.confirm(modalText)) {
      window.location.href = '/';
    }
  } catch (error) {
    checkoutMessage.textContent = error.message;
  }
});

renderSummary();
