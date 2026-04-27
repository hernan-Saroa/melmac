/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

console.log('--- MAIN.TS IS EXECUTING ---');

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => console.log('--- BOOTSTRAP SUCCESS ---'))
  .catch(err => {
    console.error('--- BOOTSTRAP FATAL ERROR ---');
    console.error(err);
  });
