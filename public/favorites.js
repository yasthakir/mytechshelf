const favoritesGrid = document.getElementById('favoritesGrid');

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

function getFavorites() {
  try {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) return JSON.parse(storedFavorites);
    const legacySaved = localStorage.getItem('savedBooks');
    return legacySaved ? JSON.parse(legacySaved) : [];
  } catch (error) {
    return [];
  }
}

function setFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
  localStorage.setItem('savedBooks', JSON.stringify(favorites));
}

function setCartCount() {
  const cartCount = document.getElementById('cartCount');
  if (cartCount) cartCount.textContent = String(getCart().length);
}

function setFavoriteCount() {
  const favoriteCount = document.getElementById('favoriteCount');
  if (favoriteCount) favoriteCount.textContent = String(getFavorites().length);
}

function addToCart(book) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === book.id);

  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ id: book.id, title: book.title, price: Number(book.price || 0), quantity: 1 });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  setCartCount();
}

function renderFavorites() {
  const favorites = getFavorites();
  setFavoriteCount();
  setCartCount();

  if (!favoritesGrid) return;

  if (!favorites.length) {
    favoritesGrid.innerHTML = '<div class="empty-state">No favorite books yet. Tap the heart on any book to save it here.</div>';
    return;
  }

  favoritesGrid.innerHTML = favorites
    .map(
      (book) => `
        <article class="book-card" data-book-id="${book.id}" tabindex="0" aria-label="Open ${book.title}">
          <button class="favorite-toggle active" data-id="${book.id}" aria-label="Remove from favorites">♥</button>
          <img src="${book.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'}" alt="${book.title}" />
          <div class="book-content">
            <div class="book-topline">
              <span class="category-tag">${book.category || 'General'}</span>
              <span class="book-badge">Saved</span>
            </div>
            <h3>${book.title}</h3>
            <p>${book.description || 'Curated for your next learning sprint.'}</p>
            <div class="book-footer">
              <strong>${money(book.price)}</strong>
              <button class="btn btn-primary add-cart-btn" data-id="${book.id}" data-title="${book.title}" data-price="${book.price}">Add to Cart</button>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  favoritesGrid.querySelectorAll('.favorite-toggle').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const currentFavorites = getFavorites().filter((item) => item.id !== button.dataset.id);
      setFavorites(currentFavorites);
      renderFavorites();
    });
  });

  favoritesGrid.querySelectorAll('.add-cart-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      addToCart({
        id: button.dataset.id,
        title: button.dataset.title,
        price: Number(button.dataset.price || 0)
      });
      button.textContent = 'Added ✓';
      setTimeout(() => {
        button.textContent = 'Add to Cart';
      }, 900);
    });
  });
}

renderFavorites();
