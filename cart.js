const cartItems = document.getElementById('cartItems');
const itemCount = document.getElementById('itemCount');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');

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

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);

  itemCount.textContent = String(totalItems);
  subtotalEl.textContent = money(total);
  totalEl.textContent = money(total);

  if (!cart.length) {
    cartItems.innerHTML = '<div class="empty-state">Your cart is empty. Add your books to continue.</div>';
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div>
            <h4>${item.title}</h4>
            <small>${money(item.price)} each</small>
          </div>
          <div class="cart-item-actions">
            <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
            <strong>${item.quantity || 1}</strong>
            <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
            <button class="btn btn-secondary" data-action="remove" data-id="${item.id}">Remove</button>
          </div>
        </div>
      `
    )
    .join('');

  cartItems.querySelectorAll('.qty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const { action, id } = button.dataset;
      const nextCart = getCart();
      const item = nextCart.find((entry) => entry.id === id);
      if (!item) return;

      if (action === 'increase') item.quantity = (item.quantity || 1) + 1;
      if (action === 'decrease') {
        item.quantity = (item.quantity || 1) - 1;
        if (item.quantity <= 0) {
          const filtered = nextCart.filter((entry) => entry.id !== id);
          saveCart(filtered);
          return;
        }
      }

      saveCart(nextCart);
    });
  });

  cartItems.querySelectorAll('[data-action="remove"]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const filtered = getCart().filter((item) => item.id !== id);
      saveCart(filtered);
    });
  });
}

renderCart();
