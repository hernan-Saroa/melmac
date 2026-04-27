const puppeteer = require('puppeteer');

(async () => {
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
        console.log('PAGE LOG:', msg.text());
    });
    
    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });
    
    page.on('response', async response => {
        if (response.url().includes('/login') && response.request().method() === 'POST') {
            console.log('API RESPONSE STATUS:', response.status());
            try { console.log('API RESPONSE BODY:', await response.text()); } catch(e) {}
        }
    });

    try {
        await page.goto('http://localhost:4200/login', {waitUntil: 'networkidle0', timeout: 30000});
        console.log("Typing credentials...");
        
        // Find inputs by placeholder or type
        await page.type('input[type="email"], input[name="email"], input[placeholder*="correo"]', 'super@saroa.co');
        await page.type('input[type="password"], input[name="password"]', 'admin123');
        
        console.log("Clicking login button...");
        // Since Nebular buttons might just be button, we click the one having "Iniciar sesión"
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Iniciar sesión') || text.includes('Iniciar')) {
                await btn.click();
                break;
            }
        }

        console.log("Waiting for network and UI changes (5s)...");
        await new Promise(r => setTimeout(r, 5000));
        
    } catch(e) {
        console.log("Puppeteer script error:", e.message);
    }
    
    await browser.close();
    console.log("Browser closed. Finished.");
})();
