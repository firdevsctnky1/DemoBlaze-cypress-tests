const LoginPage = require('../pages/LoginPage');
const PurchasePage = require('../pages/PurchasePage');

describe('Purchase flow — reliable typing (dynamic product)', () => {
  const USER = 'Firdevs';
  const PASS = '12345';

  // Data for the place order
  const order = {
    name:   'Firdevs Çetinkaya',
    country:'Germany',
    city:   'Berlin',
    card:   '4242424242424242',
    month:  '12',
    year:   '2026'
  };

  beforeEach(() => {
    LoginPage.login(USER, PASS);
    LoginPage.assertSuccess(USER);
  });

  afterEach(() => {
    if (typeof LoginPage.logoutIfLoggedIn === 'function') {
      LoginPage.logoutIfLoggedIn();
    }
  });

  it('purchases a laptop successfully', () => {
    // 1) Home → Laptops
    PurchasePage.goHome();
    PurchasePage.openLaptops();

    // 2) Choose product name:
    const envProduct = (Cypress.env('product') || '').trim();

    if (envProduct) {
      cy.wrap(envProduct).as('productName');
    } else {
      cy.get('.card-title').first().invoke('text').then(t => t.trim()).as('productName');
    }

    // 3) Open product, read dynamic price, complete the purchase flow
    cy.get('@productName').then((PRODUCT) => {
      // Go to product detail
      PurchasePage.openProduct(PRODUCT);

      // Read price from the detail page
      PurchasePage.getDetailPrice().then(price => {
        // Add to cart → Cart page
        PurchasePage.addToCartAndAssert();
        PurchasePage.goToCart();

        // Verify cart shows the product and the total equals the captured price
        PurchasePage.assertCartHasProductAndTotal(PRODUCT, price);

        // Place Order , fill form , submit
        PurchasePage.openPlaceOrderModal();
        PurchasePage.fillOrderForm(order);
        PurchasePage.submitPurchase();

        // Verify receipt (Amount + Name) and confirm with OK button
        PurchasePage.verifyReceiptAndConfirm({
          expectedAmount: price,
          expectedName:   'Firdevs'
        });

        // Ensure the cart is empty on the cart page
        PurchasePage.assertCartEmpty();
      });
    });
  });
});
