const fs = require('fs');

const tsPath = 'src/app/pages/geoportal/geoportal.component.ts';
let ts = fs.readFileSync(tsPath, 'utf8');

if (!ts.includes("import * as localforage from 'localforage';")) {
  ts = ts.replace('import "leaflet-polylinedecorator";', 
`import "leaflet-polylinedecorator";
import * as localforage from 'localforage';
import * as SuperclusterModule from 'supercluster';
const Supercluster = (SuperclusterModule as any).default || SuperclusterModule;`);
}

if (!ts.includes('clusterIndex: any;')) {
  ts = ts.replace('markerCluster: any;', 'markerCluster: any;\n  clusterIndex: any;');
}

const oldUpdate = `      if (this.markerData != projects.concat(answers, devices, path_markers, users)){
        this.markerData = projects.concat(answers, devices, path_markers, users);
      }
      this.loading = false;
    }, 300);
  }`;

const newUpdate = `      let all_markers = projects.concat(answers, devices, path_markers, users).filter(m => m && typeof m.getLatLng === 'function');

      if (this.group) {
         if (!this.clusterIndex) {
            // @ts-ignore
            this.clusterIndex = new Supercluster({
                radius: 60,
                maxZoom: 16
            });
         }
         const features = all_markers.map((m, i) => ({
             type: 'Feature',
             geometry: { type: 'Point', coordinates: [m.getLatLng().lng, m.getLatLng().lat] },
             properties: { index: i, originalMarker: m }
         }));
         this.clusterIndex.load(features);
         this.refreshSupercluster();
      } else {
         if (this.markerData != all_markers){
           this.markerData = all_markers;
         }
      }
      this.loading = false;
    }, 300);
  }`;

if (ts.includes(oldUpdate)) {
  ts = ts.replace(oldUpdate, newUpdate);
}

const newMethod = `
  refreshSupercluster() {
      if (!this.map || !this.clusterIndex || !this.group) return;
      const bounds = this.map.getBounds();
      let bbox = [bounds.getWest() - 0.5, bounds.getSouth() - 0.5, bounds.getEast() + 0.5, bounds.getNorth() + 0.5];
      const zoom = this.map.getZoom();
      const clusters = this.clusterIndex.getClusters(bbox, zoom);
      
      const newMarkers = clusters.map((c: any) => {
          if (c.properties.cluster) {
              const count = c.properties.point_count_abbreviated;
              let secondary_class = c.properties.point_count < 50 ? 'marker-cluster-small' : (c.properties.point_count < 200) ? 'marker-cluster-medium' : 'marker-cluster-large';
              let n = '<div><span>'+count+'</span></div>';
              
              const icon = L.divIcon({ html: n, className: 'leaflet-marker-icon marker-cluster leaflet-zoom-animated leaflet-interactive ' + secondary_class , iconSize: L.point(40, 40) });
              const m = new L.Marker([c.geometry.coordinates[1], c.geometry.coordinates[0]], { icon });
              
              m.on('click', () => {
                  this.map.flyTo([c.geometry.coordinates[1], c.geometry.coordinates[0]], this.map.getZoom() + 2);
              });
              return m;
          } else {
              return c.properties.originalMarker;
          }
      });
      this.markerData = newMarkers;
  }
`;

if (!ts.includes('refreshSupercluster() {')) {
  ts = ts.replace('updatePathsShown(){', newMethod + '\n  updatePathsShown(){');
}

const oldOnDataUser = `  onDataUser(first?) {
    this.loading = true;
    this.geoportalService.listUser(this.follow_options).subscribe(
      response => {`;

const newOnDataUser = `  async onDataUser(first?) {
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

if (ts.includes(oldOnDataUser)) {
  ts = ts.replace(oldOnDataUser, newOnDataUser);
}

const oldEndDataUser = `        }

      }, null, ()=>{
        this.loading = false;

        this.updateMarkersShown();
      }
    );
  }

  onMapReady(map:Map){`;

const newEndDataUser = `        }
      }
      this.updatePathsShown();
      this.updateMarkersShown();
    }
  }

  onMapReady(map:Map){`;

if (ts.includes(oldEndDataUser)) {
  ts = ts.replace(oldEndDataUser, newEndDataUser);
}

fs.writeFileSync(tsPath, ts);
console.log("TS successfully regenerated with offline supercluster support.");
