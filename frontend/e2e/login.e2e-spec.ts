import { browser, by, element, ExpectedConditions } from 'protractor';

describe('Pruebas E2E: Login de Melmac', () => {

  beforeEach(async () => {
    // Navigate to the login page
    await browser.waitForAngularEnabled(false);
    await browser.get('/login');
  });

  it('Debería iniciar sesión correctamente con credenciales válidas', async () => {
    const emailInput = element(by.name('email'));
    const passwordInput = element(by.name('password'));
    const submitBtn = element(by.css('.btn-primary-modern'));

    // Wait for the email input to be present
    await browser.wait(ExpectedConditions.presenceOf(emailInput), 5000);

    // Enter valid credentials
    await emailInput.sendKeys('super@saroa.co');
    await passwordInput.sendKeys('admin123');
    
    // Click login
    await submitBtn.click();

    // Verify successful login by checking URL change or presence of dashboard element
    // Wait until the URL changes to home
    await browser.wait(ExpectedConditions.urlContains('/pages/home'), 10000, 'El login no redirigió a /pages/home en el tiempo esperado.');
    
    expect(await browser.getCurrentUrl()).toContain('/pages/home');
  });

  it('Debería mostrar error de formato con un correo inválido', async () => {
    const emailInput = element(by.name('email'));
    const submitBtn = element(by.css('.btn-primary-modern'));

    await browser.wait(ExpectedConditions.presenceOf(emailInput), 5000);

    // Enter invalid email
    await emailInput.sendKeys('correo_invalido');
    
    // Click outside or try to click submit
    await submitBtn.click();

    // Find the error message element
    const errorMsg = element(by.css('.error-msg span'));
    
    await browser.wait(ExpectedConditions.presenceOf(errorMsg), 5000);
    const text = await errorMsg.getText();
    
    expect(text).toContain('Formato de correo inválido');
  });

});
