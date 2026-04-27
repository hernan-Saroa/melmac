const fs = require('fs');
const path = 'src/app/pages/geoportal/geoportal.component.ts';
let text = fs.readFileSync(path, 'utf8');

if (!text.includes('import * as localforage from "localforage";')) {
    text = text.replace('import "leaflet-polylinedecorator";', 'import "leaflet-polylinedecorator";\nimport * as localforage from "localforage";');
}

const oldFunc = `  onDataUser(first?) {
    this.loading = true;
    this.geoportalService.listUser(this.follow_options).subscribe(
      response => {`;

const newFunc = `  async onDataUser(first?) {
    this.loading = true;
    const cacheKey = 'geoportal_user_data_' + JSON.stringify(this.follow_options);
    
    try {
      const cached = await localforage.getItem(cacheKey);
      if (cached) {
         this.processDataUser(cached, first);
      }
    } catch(e) {}

    if (navigator.onLine) {
      this.geoportalService.listUser(this.follow_options).subscribe(
        async (response: any) => {
          await localforage.setItem(cacheKey, response);
          this.processDataUser(response, first);
        },
        error => { this.loading = false; }
      );
    } else {
      this.loading = false;
    }
  }

  processDataUser(response: any, first?: any) {`;

if (text.includes('this.geoportalService.listUser(this.follow_options).subscribe(')) {
    text = text.replace(oldFunc, newFunc);
}

const oldEnd = `        }
      }, null, ()=>{
        // this.loading = false;
      }
    );
  }

  onDataDevice() {`;

const newEnd = `        }
  }

  onDataDevice() {`;

if (text.includes('this.loading = false;') && text.includes('onDataDevice')) {
    text = text.replace(oldEnd, newEnd);
}

fs.writeFileSync(path, text);
console.log('Patch complete.');
