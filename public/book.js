const API_BASE = (window.MYTECHSHELF_API_URL || '') || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'https://mytechshelf-backend.onrender.com');
const apiUrl = (path) => `${API_BASE}${path}`;

const detailBookImage = document.getElementById('detailBookImage');
const detailBookCategory = document.getElementById('detailBookCategory');
const detailBookTitle = document.getElementById('detailBookTitle');
const detailBookRating = document.getElementById('detailBookRating');
const detailBookRatingText = document.getElementById('detailBookRatingText');
const detailBookAuthor = document.getElementById('detailBookAuthor');
const detailBookDescription = document.getElementById('detailBookDescription');
const detailBookPrice = document.getElementById('detailBookPrice');
const detailBookStock = document.getElementById('detailBookStock');
const reviewsSummary = document.getElementById('reviewsSummary');
const reviewsList = document.getElementById('reviewsList');
const purchaseModal = document.getElementById('purchaseModal');
const orderForm = document.getElementById('orderForm');
const orderMessage = document.getElementById('orderMessage');
const selectedBookTitle = document.getElementById('selectedBookTitle');
const selectedBookPrice = document.getElementById('selectedBookPrice');
const qrImage = document.getElementById('qrImage');
const bookIdInput = document.getElementById('bookIdInput');
const amountInput = document.getElementById('amountInput');
const paymentStatusInput = document.getElementById('paymentStatusInput');
const paymentCountdown = document.getElementById('paymentCountdown');
const paymentActionRow = document.getElementById('paymentActionRow');
const paymentPaidBtn = document.getElementById('paymentPaidBtn');
const paymentNotPaidBtn = document.getElementById('paymentNotPaidBtn');
const addCartDetail = document.querySelector('.add-cart-detail');
const paymentStatusBox = document.getElementById('paymentStatusBox');
let paymentDecisionTimer = null;

let currentBook = null;

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (error) {
    return [];
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (badge) {
    badge.textContent = String(getCart().length);
  }
}

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function getStarMarkup(rating = 0) {
  const totalStars = 5;
  const filledCount = Math.round(Number(rating || 0));

  return Array.from({ length: totalStars }, (_, index) => {
    const active = index < filledCount;
    return `<span class="star ${active ? 'filled' : ''}">★</span>`;
  }).join('');
}

function populateReviewList(reviews = []) {
  if (!reviews.length) {
    reviewsList.innerHTML = '<div class="review-card empty-review">No reviews yet. Be the first to share your feedback.</div>';
    return;
  }

  reviewsList.innerHTML = reviews
    .map(
      (review) => `
        <article class="review-card">
          <div class="review-headline">
            <strong>${review.name || 'Reader'}</strong>
            <span class="review-stars">${getStarMarkup(review.rating || 5)}</span>
          </div>
          <p>${review.comment || 'Great experience.'}</p>
        </article>
      `
    )
    .join('');
}

async function loadBook() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const routeId = pathParts[pathParts.length - 1] || new URLSearchParams(window.location.search).get('id');

  if (!routeId) {
    window.location.href = '/';
    return;
  }

  const response = await fetch(apiUrl(`/api/books/${routeId}`));

  if (!response.ok) {
    window.location.href = '/';
    return;
  }

  currentBook = await response.json();

  detailBookImage.src = currentBook.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';
  detailBookImage.alt = currentBook.title;
  detailBookCategory.textContent = currentBook.category || 'General';
  detailBookTitle.textContent = currentBook.title;
  detailBookAuthor.textContent = `By ${currentBook.author}`;
  detailBookDescription.textContent = currentBook.description;
  detailBookPrice.textContent = money(currentBook.price);
  detailBookStock.textContent = `${currentBook.stock || 25} left`;
  detailBookRating.innerHTML = getStarMarkup(currentBook.rating || 4.8);
  detailBookRatingText.textContent = Number(currentBook.rating || 4.8).toFixed(1);

  const reviewCount = Array.isArray(currentBook.reviews) ? currentBook.reviews.length : 0;
  reviewsSummary.innerHTML = `
    <div class="stat-pill">
      <strong>${Number(currentBook.rating || 4.8).toFixed(1)}</strong>
      <span>Average rating</span>
    </div>
    <div class="stat-pill">
      <strong>${reviewCount}</strong>
      <span>Reviews</span>
    </div>
  `;

  populateReviewList(currentBook.reviews || []);

  if (new URLSearchParams(window.location.search).get('buy') === '1') {
    openPurchaseModal(currentBook);
  }
}

async function openPurchaseModal(book) {
  if (!book) return;

  selectedBookTitle.textContent = book.title;
  selectedBookPrice.textContent = money(book.price);
  bookIdInput.value = book.id;
  amountInput.value = String(book.price);

  const qrResponse = await fetch(apiUrl(`/api/qr?amount=${book.price}`));
  const qrData = await qrResponse.json();
  qrImage.src = qrData.qrDataUrl;

  paymentStatusInput.value = 'Pending';
  paymentActionRow?.classList.add('hidden');
  paymentStatusBox?.classList.remove('show');
  paymentCountdown.textContent = 'Waiting 5 seconds...';
  purchaseModal.classList.remove('hidden');
  purchaseModal.setAttribute('aria-hidden', 'false');
  showPaymentChoice();
}

function closePurchaseModal() {
  purchaseModal.classList.add('hidden');
  purchaseModal.setAttribute('aria-hidden', 'true');
  orderForm.reset();
  paymentStatusInput.value = 'Pending';
  if (paymentDecisionTimer) {
    clearInterval(paymentDecisionTimer);
    paymentDecisionTimer = null;
  }
  paymentActionRow?.classList.add('hidden');
  paymentStatusBox?.classList.remove('show');
  paymentCountdown.textContent = 'Waiting 5 seconds...';
  orderMessage.textContent = '';
}

function showPaymentChoice() {
  if (!paymentStatusBox) return;
  paymentStatusBox.classList.add('show');
  let remaining = 5;

  if (paymentDecisionTimer) {
    clearInterval(paymentDecisionTimer);
  }

  paymentDecisionTimer = setInterval(() => {
    remaining -= 1;
    paymentCountdown.textContent = remaining > 0 ? `Waiting ${remaining} seconds...` : 'Choose payment status';

    if (remaining <= 0) {
      clearInterval(paymentDecisionTimer);
      paymentDecisionTimer = null;
      paymentActionRow?.classList.remove('hidden');
    }
  }, 1000);
}

addCartDetail?.addEventListener('click', () => {
  if (!currentBook) return;
  const cart = getCart();
  const existing = cart.find((item) => item.id === currentBook.id);

  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({
      id: currentBook.id,
      title: currentBook.title,
      price: Number(currentBook.price || 0),
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
  addCartDetail.textContent = 'Added ✓';
  setTimeout(() => {
    addCartDetail.textContent = 'Add to Cart';
  }, 900);
});

document.querySelector('[data-close="true"]').addEventListener('click', closePurchaseModal);
document.querySelector('.modal-close').addEventListener('click', closePurchaseModal);
paymentPaidBtn?.addEventListener('click', () => {
  paymentStatusInput.value = 'Paid';
  paymentActionRow?.classList.add('hidden');
  paymentCountdown.textContent = 'Payment proof required';
  orderForm.querySelector('input[name="screenshot"]').required = true;
  orderMessage.textContent = 'Upload the payment screenshot to complete your order.';
});
paymentNotPaidBtn?.addEventListener('click', () => {
  paymentStatusInput.value = 'Pending';
  paymentActionRow?.classList.add('hidden');
  paymentCountdown.textContent = 'Payment pending';
  const screenshotInput = orderForm.querySelector('input[name="screenshot"]');
  screenshotInput.required = false;
  screenshotInput.value = '';
  orderMessage.textContent = 'Payment is still pending. You can submit later with proof.';
});

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  orderMessage.textContent = 'Submitting your purchase...';

  const formData = new FormData(orderForm);
  formData.append('bookId', currentBook.id);
  formData.append('amount', String(currentBook.price));

  if (paymentStatusInput.value === 'Paid' && !formData.get('screenshot')?.name) {
    orderMessage.textContent = 'Please upload the payment screenshot before submitting.';
    return;
  }

  try {
    const response = await fetch(apiUrl('/api/orders'), {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Purchase failed. Please try again.');
    }

    orderMessage.textContent = result.message || 'Purchase successful!';
    setTimeout(() => {
      closePurchaseModal();
      window.location.href = '/';
    }, 2000);
  } catch (error) {
    orderMessage.textContent = error.message;
    orderMessage.style.color = '#fca5a5';
  }
});

updateCartBadge();
loadBook();
