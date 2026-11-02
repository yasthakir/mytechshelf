const API_BASE = (window.MYTECHSHELF_API_URL || '') || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'https://mytechshelf-backend.onrender.com');
const apiUrl = (path) => `${API_BASE}${path}`;

const booksGrid = document.getElementById('booksGrid');

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
  if (!cartCount) return;
  cartCount.textContent = String(getCart().length);
}

function setFavoriteCount() {
  const favoriteCount = document.getElementById('favoriteCount');
  const legacySaveCount = document.getElementById('saveCount');
  const total = getFavorites().length;
  if (favoriteCount) favoriteCount.textContent = String(total);
  if (legacySaveCount) legacySaveCount.textContent = String(total);
}

function renderStars(rating = 0) {
  const whole = Math.round(rating);
  const stars = Array.from({ length: 5 }, (_, index) => {
    const filled = index < whole;
    return `<span class="star ${filled ? 'filled' : ''}">★</span>`;
  }).join('');

  return `<span class="star-row" aria-label="${rating} out of 5 stars">${stars}</span>`;
}

function addToCart(book) {
  const cart = getCart();
  const existingItem = cart.find((item) => item.id === book.id);

  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cart.push({
      id: book.id,
      title: book.title,
      price: Number(book.price || 0),
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  setCartCount();
}

function toggleFavorite(book) {
  const favorites = getFavorites();
  const exists = favorites.find((item) => item.id === book.id);

  if (exists) {
    const nextFavorites = favorites.filter((item) => item.id !== book.id);
    setFavorites(nextFavorites);
  } else {
    const nextFavorites = [...favorites, {
      id: book.id,
      title: book.title,
      price: Number(book.price || 0),
      image: book.image || '',
      category: book.category || 'General',
      description: book.description || ''
    }];
    setFavorites(nextFavorites);
  }

  setFavoriteCount();
  return getFavorites();
}

async function loadBooks() {
  const response = await fetch(apiUrl('/api/books'));
  const books = await response.json();

  const visibleBooks = books.slice(0, 5);

  booksGrid.innerHTML = visibleBooks
    .map((book) => {
      const favorites = getFavorites();
      const isFavorite = favorites.some((item) => item.id === book.id);

      return `
        <article class="book-card" data-book-id="${book.id}" tabindex="0" aria-label="Open ${book.title}">
          <button class="favorite-toggle ${isFavorite ? 'active' : ''}" data-id="${book.id}" data-title="${book.title}" data-price="${book.price}" data-image="${book.image || ''}" data-category="${book.category || 'General'}" data-description="${book.description || ''}" aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">${isFavorite ? '♥' : '♡'}</button>
          <img src="${book.image || book.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'}" alt="${book.title}" />
          <div class="book-content">
            <div class="book-topline">
              <span class="category-tag">${book.category || 'General'}</span>
              <span class="book-badge">${book.featured ? 'Featured' : 'Popular'}</span>
            </div>
            <h3>${book.title}</h3>
            <div class="author-line">By ${book.author}</div>
            <div class="meta-row">
              ${renderStars(book.rating || 4.8)}
              <span class="rating-copy">${Number(book.rating || 4.8).toFixed(1)}</span>
            </div>
            <p>${book.description}</p>
            <div class="book-footer">
              <strong>${money(book.price)}</strong>
              <button class="btn btn-primary add-cart-btn" data-id="${book.id}" data-title="${book.title}" data-price="${book.price}">Add to Cart</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

  document.querySelectorAll('.book-card').forEach((card) => {
    const openBook = () => {
      const bookId = card.dataset.bookId;
      if (bookId) window.location.href = `/book/${bookId}`;
    };

    card.addEventListener('click', (event) => {
      if (event.target.closest('.add-cart-btn')) return;
      openBook();
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openBook();
      }
    });
  });

  document.querySelectorAll('.add-cart-btn').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const book = {
        id: btn.dataset.id,
        title: btn.dataset.title,
        price: Number(btn.dataset.price || 0)
      };
      addToCart(book);
      btn.textContent = 'Added ✓';
      setTimeout(() => {
        btn.textContent = 'Add to Cart';
      }, 900);
    });
  });

  document.querySelectorAll('.favorite-toggle').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const book = {
        id: btn.dataset.id,
        title: btn.dataset.title,
        price: Number(btn.dataset.price || 0),
        image: btn.dataset.image || '',
        category: btn.dataset.category || 'General',
        description: btn.dataset.description || ''
      };
      const updatedFavorites = toggleFavorite(book);
      const active = updatedFavorites.some((item) => item.id === book.id);
      btn.textContent = active ? '♥' : '♡';
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-label', active ? 'Remove from favorites' : 'Add to favorites');
    });
  });

  setCartCount();
  setFavoriteCount();
}

const reviewData = [
  { stars: '★★★★★', text: '“The lessons are super practical and easy to apply.”', name: 'Priya S.' },
  { stars: '★★★★★', text: '“Perfect for fast upskilling and career-focused learning.”', name: 'Arjun M.' },
  { stars: '★★★★★', text: '“Clean structure, good examples, and total value for money.”', name: 'Nisha K.' },
  { stars: '★★★★★', text: '“Interview tips were gold. Landed my first dev job.”', name: 'Rahul V.' },
  { stars: '★★★★★', text: '“Beautifully explained and super practical content.”', name: 'Anita P.' },
  { stars: '★★★★★', text: '“Great for quick upskilling between work hours.”', name: 'Karthik R.' },
  { stars: '★★★★★', text: '“Loved the real-world project examples.”', name: 'Meera L.' },
  { stars: '★★★★★', text: '“Worth every rupee. Highly recommend.”', name: 'Suresh T.' },
  { stars: '★★★★★', text: '“Clear, concise and actionable content.”', name: 'Divya N.' },
  { stars: '★★★★★', text: '“Perfect companion for interview prep.”', name: 'Arun K.' },
];

const reviewCards = document.querySelectorAll('.floating-review');
let rIndex = 0;

function renderReviews() {
  reviewCards.forEach((card, i) => {
    const d = reviewData[(rIndex + i) % reviewData.length];
    card.querySelector('.bubble-stars').textContent = d.stars;
    card.querySelector('p').textContent = d.text;
    card.querySelector('strong').textContent = d.name;
  });
}

if (reviewCards.length) {
  renderReviews();
  setInterval(() => {
    rIndex = (rIndex + 3) % reviewData.length;
    renderReviews();
  }, 10000);
}

setCartCount();
setFavoriteCount();
loadBooks();
