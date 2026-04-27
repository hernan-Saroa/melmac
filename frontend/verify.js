const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
        console.log('PAGE LOG:', msg.text());
    });
    
    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });
    
    console.log("Navigating to login page at /login ...");
    try {
        await page.goto('http://localhost:4200/login', {waitUntil: 'networkidle0', timeout: 30000});
    } catch(e) {
        console.log("Navigation timeout or error:", e.message);
    }
    
    console.log("Waiting 3 seconds...");
    await new Promise(r => setTimeout(r, 3000));
    
    console.log("Taking screenshot...");
    await page.screenshot({path: 'correct_login_test.png'});
    
    const html = await page.content();
    fs.writeFileSync('correct_login_dump.html', html);
    
    await browser.close();
    console.log("Browser closed. Finished.");
})();
