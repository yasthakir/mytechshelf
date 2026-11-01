const checkoutSummary = document.getElementById('checkoutSummary');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutMessage = document.getElementById('checkoutMessage');

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

checkoutForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const cart = getCart();

  if (!cart.length) {
    checkoutMessage.textContent = 'Your cart is empty.';
    return;
  }

  const formData = new FormData(checkoutForm);
  const orderData = {
    customer: Object.fromEntries(formData.entries()),
    items: cart,
    total: cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0),
    createdAt: new Date().toISOString()
  };

  localStorage.setItem('lastOrder', JSON.stringify(orderData));
  localStorage.removeItem('cart');
  checkoutMessage.textContent = 'Order placed successfully! Your books will be delivered by email/WhatsApp.';
  checkoutForm.reset();
  renderSummary();
});

renderSummary();
