const LoginPage = require('../pages/LoginPage');

const USER = 'Firdevs';
const PASS = '12345';

describe('Login flow', () => {
  afterEach(() => LoginPage.logoutIfLoggedIn());

  it('logs in successfully (valid username + valid password)', () => {
    LoginPage.login(USER, PASS);
    LoginPage.assertSuccess(USER);
  });

  it('fails with wrong username + correct password', () => {
    LoginPage.login('wrong', PASS);
    LoginPage.assertFailOneOf();  // "Wrong password."
  });

  it('fails with correct username + wrong password', () => {
    LoginPage.login(USER, 'wrong_password');
    LoginPage.assertFailOneOf();  
  });
});
