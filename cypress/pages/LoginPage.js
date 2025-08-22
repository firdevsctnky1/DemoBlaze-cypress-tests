class LoginPage {
  els = {
    loginLink: '#login2',
    loginModal: '#logInModal',
    username: '#loginusername',
    password: '#loginpassword',
    submit: 'button[onclick="logIn()"]',
    welcomeUser: '#nameofuser',
    logout: '#logout2',
    closeLogin: '#logInModal .btn-secondary'
  };

  visit() { cy.visit('/'); }

  openLoginModal() {
    cy.get(this.els.loginLink).click();
    cy.get(this.els.loginModal).should('be.visible');
  }

  // type + verify the value
  fillUsername(u) {
    cy.get(this.els.username)
      .should('be.visible')
      .clear()
      .type(u, { delay: 40 })
      .should('have.value', u);
  }

  fillPassword(p) {
    cy.get(this.els.password)
      .should('be.visible')
      .clear()
      .type(p, { delay: 40 })
      .should('have.value', p);
  }

  submit() { cy.get(this.els.submit).click(); }

  // Full login flow
  login(username, password) {
    this.visit();
    this.openLoginModal();
    cy.window().then(win => cy.stub(win, 'alert').as('alert'));
    this.fillUsername(username);
    this.fillPassword(password);
    cy.get(this.els.username).should('have.value', username);
    cy.get(this.els.password).should('have.value', password);
    this.submit();
  }

  assertSuccess(username) {
    cy.get('@alert').should('not.have.been.called');
    cy.get(this.els.welcomeUser)
      .should('be.visible')
      .and('have.text', `Welcome ${username}`);
  }

  // Accept either message Demoblaze shows
  assertFailOneOf() {
    cy.get('@alert')
      .should('have.been.called')
      .and('have.been.calledWithMatch', /(Wrong password\.|User does not exist\.)/);

    // Close modal if still open so the next test starts clean
    cy.get('body').then($b => {
      const $modal = $b.find('#logInModal:visible');
      if ($modal.length) cy.contains('#logInModal button', 'Close').click();
    });
  }

  // Only click logout if visible (won’t fail after negative tests)
  logoutIfLoggedIn() {
    cy.get('body').then($b => {
      const $btn = $b.find(`${this.els.logout}:visible`);
      if ($btn.length) cy.wrap($btn).click();
    });
  }
}

module.exports = new LoginPage();
