const fs = require('fs');

// Patch HTML
const htmlPath = 'src/app/pages/geoportal/geoportal.component.html';
let html = fs.readFileSync(htmlPath, 'utf8');

const oldHtml = `          [leafletLayers]="group ? [] : markerData"
          [leafletMarkerCluster]="group ? markerData : []"
          [leafletMarkerClusterOptions]="markerClusterOptions"
          (leafletMarkerClusterReady)="markerClusterReady($event)"`;

const newHtml = `          [leafletLayers]="markerData"
          (leafletMapMoveEnd)="refreshSupercluster()"`;

if (html.includes(oldHtml)) {
    html = html.replace(oldHtml, newHtml);
    fs.writeFileSync(htmlPath, html);
    console.log("HTML Patched!");
}

// Patch TS
const tsPath = 'src/app/pages/geoportal/geoportal.component.ts';
let ts = fs.readFileSync(tsPath, 'utf8');

if (!ts.includes("import Supercluster from 'supercluster';")) {
    ts = ts.replace("import * as localforage from 'localforage';", "import * as localforage from 'localforage';\nimport Supercluster from 'supercluster';");
}

const oldUpdate = `      let all_markers = projects.concat(answers, devices, path_markers, users).filter(m => m && typeof m.getLatLng === 'function');

      if (this.markerData != all_markers){
        this.markerData = all_markers;
      }
      this.loading = false;`;

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
      this.loading = false;`;

if (ts.includes(oldUpdate)) {
    ts = ts.replace(oldUpdate, newUpdate);
}

const newMethod = `
  refreshSupercluster() {
      if (!this.map || !this.clusterIndex || !this.group) return;
      const bounds = this.map.getBounds();
      // Pad out the bounds slightly to load points just offscreen
      let bbox = [bounds.getWest() - 0.5, bounds.getSouth() - 0.5, bounds.getEast() + 0.5, bounds.getNorth() + 0.5];
      const zoom = this.map.getZoom();
      
      const clusters = this.clusterIndex.getClusters(bbox, zoom);
      
      const newMarkers = clusters.map(c => {
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
    
    // Add clusterIndex to class root
    ts = ts.replace('markerCluster: any;', 'markerCluster: any;\n  clusterIndex: any;');
}

fs.writeFileSync(tsPath, ts);
console.log("TS Patched!");
