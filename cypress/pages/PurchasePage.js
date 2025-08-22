class PurchasePage {
  els = {
    // categories & listing
    categoryLink: '.list-group a',
    productCard:  '.card',
    productCardTitle: '.card-title',

    // product detail
    addToCartBtn: 'a[onclick^="addToCart("]',

    // cart
    cartLink: '#cartur',
    cartTableBody: '#tbodyid',
    cartTotal: '#totalp',

    // place order modal
    orderModal: '#orderModal',
    inputName: '#name',
    inputCountry: '#country',
    inputCity: '#city',
    inputCard: '#card',
    inputMonth: '#month',
    inputYear: '#year',
  
    purchaseBtn: '#orderModal .modal-footer > button.btn.btn-primary',

    // labels
    placeOrderText: 'Place Order',

    // SweetAlert
    sweetAlert: '.sweet-alert, .swal2-popup',
    overlay: '.sweet-overlay, .swal2-container',
  };

  //  Navigation  & category
  goHome() { cy.visit('/'); }

  /** Open any category with a network guard (defaults to Laptops) */
  openCategory(name = 'Laptops') {
    cy.intercept('POST', '**/bycat**').as('byCat');
    cy.contains(this.els.categoryLink, new RegExp(`^${name}$`, 'i')).click();
    cy.wait('@byCat');
    cy.get(this.els.productCardTitle).should('exist'); // list rendered
  }

  /** Backward-compatible alias */
  openLaptops() {
    this.openCategory('Laptops');
  }

  //  Product selection
  /** Open product detail by product title text (from listing) */
  openProduct(productName) {
    cy.contains(this.els.productCardTitle, productName).click();
    cy.get(this.els.addToCartBtn).should('be.visible'); // detail ready
  }

  /** Get the first product name currently shown in the list (trimmed) */
  getFirstProductName() {
    return cy.get(this.els.productCardTitle).first().invoke('text').then(t => t.trim());
  }

  /**
   * Read price from the list card of a given product (Number).
   * Uses a flexible selector for the price node inside a card.
   */
  getListPrice(productName) {
    return cy
      .contains(this.els.productCardTitle, productName)
      .closest(this.els.productCard)
      .find('.price-container, h5, .price')
      .first()
      .should('be.visible')
      .invoke('text')
      .then(t => {
        const m = t.match(/\d+/);
        return Number(m ? m[0] : 0);
      });
  }

  /**
   * Read the price on the product DETAIL page and return Number.
   * Detail page shows something like: "$790 *includes tax".
   */
  getDetailPrice() {
    return cy.get('h3.price-container')
      .should('be.visible')
      .invoke('text')
      .then(t => {
        const m = t.match(/\d+/);
        return Number(m ? m[0] : 0);
      });
  }

  // Cart & order flow
  addToCartAndAssert() {
    // Stub native alert to assert "Product added."
    cy.window().then(win => cy.stub(win, 'alert').as('alert'));
    cy.get(this.els.addToCartBtn).should('be.visible').scrollIntoView().click();
    cy.get('@alert')
      .should('have.been.called')
      .and('have.been.calledWithMatch', /^Product added\.?$/);
  }

  goToCart() {
    cy.intercept('POST', '**/viewcart**').as('viewCart');
    cy.get(this.els.cartLink).click();
    cy.wait('@viewCart'); // ensure cart table is refreshed
    cy.contains('button', this.els.placeOrderText).should('be.visible');
  }

  /** Assert the item is listed in the cart and total equals expectedAmount */
  assertCartHasProductAndTotal(productName, expectedAmount) {
    cy.get(this.els.cartTableBody).should('contain.text', productName);
    cy.get(this.els.cartTotal)
      .should('be.visible')
      .invoke('text')
      .then(t => Number(t.trim()))
      .should('eq', expectedAmount);
  }

  /** return cart total as Number */
  getCartTotal() {
    return cy.get(this.els.cartTotal)
      .should('be.visible')
      .invoke('text')
      .then(t => Number((t || '').trim() || 0));
  }

  openPlaceOrderModal() {
    cy.contains('button', this.els.placeOrderText).click();
    cy.get(this.els.orderModal).should('be.visible').and('have.class', 'show');
  }

  fillOrderForm({ name, country, city, card, month, year }) {
    cy.get(this.els.orderModal).should('be.visible').and('have.class', 'show').within(() => {
      cy.safeType('#name',    name);
      cy.safeType('#country', country);
      cy.safeType('#city',    city);
      cy.safeType('#card',    card);
      cy.safeType('#month',   month);
      cy.safeType('#year',    year);
    });
  }

  /** Click Purchase and assert via network + popup */
  submitPurchase() {
    cy.get(this.els.orderModal).should('be.visible').and('have.class', 'show');

    // server-side cleanup after purchase
    cy.intercept('POST', '**/deletecart').as('deleteCart');

    cy.contains(this.els.purchaseBtn, /^Purchase$/)
      .should('be.visible')
      .and('be.enabled')
      .click({ force: true });

    cy.wait('@deleteCart').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.get(this.els.sweetAlert, { timeout: 10000 }).should('be.visible');
  }

  /** Verify receipt (Amount + Name), then click OK and ensure popup closes */
  verifyReceiptAndConfirm({ expectedAmount, expectedName }) {
    // Title
    cy.get(this.els.sweetAlert).should('be.visible').within(() => {
      cy.get('h2').should('have.text', 'Thank you for your purchase!');
    });

    // Parse entire popup text to validate fields
    cy.get(this.els.sweetAlert).invoke('text').then(raw => {
      const text = raw.replace(/\r/g, '').trim();
      const amountMatch = text.match(/Amount:\s*([\d.,]+)/i);
      const nameMatch   = text.match(/Name:\s*(.+)/i);

      if (expectedAmount !== undefined) {
        const parsedAmount = amountMatch
          ? parseInt(amountMatch[1].replace(/[.,](?=\d{3}\b)/g, ''), 10)
          : NaN;
        expect(parsedAmount, 'receipt Amount').to.eq(expectedAmount);
      }
      if (expectedName) {
        const name = nameMatch ? nameMatch[1].trim() : '';
        expect(name, 'receipt Name').to.contain(expectedName);
      }
    });

    // Click OK
    cy.get('button.confirm:visible, button.swal2-confirm:visible')
      .should('be.visible')
      .and('contain.text', 'OK')
      .click({ force: true });

    // SweetAlert v1 stays in DOM; assert it's hidden
    cy.get(this.els.sweetAlert, { timeout: 10000 }).should('not.be.visible');
    cy.get(this.els.overlay,   { timeout: 10000 }).should('not.be.visible');
  }

  /** Verify the cart is empty after purchase */
  assertCartEmpty() {
    cy.visit('/cart.html');
    cy.intercept('POST', '**/viewcart**').as('viewCart');
    cy.wait('@viewCart');

    cy.get(this.els.cartTableBody, { timeout: 10000 }).should('exist');
    cy.get(this.els.cartTableBody).find('a[onclick^="deleteItem("]').should('have.length', 0);
    cy.get(this.els.cartTableBody).find('tr:visible').should('have.length', 0);
    this.getCartTotal().should('eq', 0);
  }
}

module.exports = new PurchasePage();
