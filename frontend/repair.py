import re
import sys

filename = 'src/app/pages/geoportal/geoportal.component.ts'
with open(filename, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Imports
if "import * as localforage" not in text:
    text = text.replace('import "leaflet-polylinedecorator";', 
        'import "leaflet-polylinedecorator";\nimport * as localforage from \'localforage\';\nimport * as SuperclusterModule from \'supercluster\';\nconst Supercluster = (SuperclusterModule as any).default || SuperclusterModule;')

# 2. standalone: false
if "standalone: false" not in text:
    text = text.replace("styleUrls: ['./geoportal.component.scss']", "styleUrls: ['./geoportal.component.scss'],\n  standalone: false")

# 3. clusterIndex
if "clusterIndex: any;" not in text:
    text = text.replace("markerCluster: any;", "markerCluster: any;\n  clusterIndex: any;")

# 4. updateMarkersShown
old_update = """      if (this.markerData != projects.concat(answers, devices, path_markers, users)){
        this.markerData = projects.concat(answers, devices, path_markers, users);
      }
      this.loading = false;
    }, 300);
  }"""

new_update = """      let all_markers = projects.concat(answers, devices, path_markers, users).filter(m => m && typeof m.getLatLng === 'function');

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
  }"""

if "refreshSupercluster()" not in text:
    # Normalize line endings to find the match
    # Since old_update uses standard \n, we can do a regex replacement or adjust spaces
    pattern = r"      if \(this\.markerData \!= projects\.concat\(answers, devices, path_markers, users\)\)\{\s+this\.markerData = projects\.concat\(answers, devices, path_markers, users\);\s+\}\s+this\.loading = false;\s+\}, 300\);\s+\}"
    text = re.sub(pattern, new_update, text)

# 5. refreshSupercluster insertion
new_method = """
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
"""

if "refreshSupercluster()" not in text:
    text = re.sub(r'(\s+)updatePathsShown\(\)\{', r'\1' + new_method + r'\n\1updatePathsShown(){', text, count=1)

# 6. onDataUser replacement
old_onDataUser_pattern = r'(\s+)onDataUser\(first\?\)\s*\{\s*this\.loading = true;\s*this\.geoportalService\.listUser\(this\.follow_options\)\.subscribe\(\s*response => \{'

new_onDataUser = r"""\1async onDataUser(first?) {
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

  processDataUser(response: any, first?: any) {"""

if "async onDataUser" not in text:
    text = re.sub(old_onDataUser_pattern, new_onDataUser, text, count=1)

# 7. end of onDataUser replacement to close processDataUser properly
old_end_pattern = r'(\s+)\},\s*null,\s*\(\)=>\{\s*this\.loading = false;\s*this\.updateMarkersShown\(\);\s*\}\s*\);\s*\}'

new_end = r"""\1  }
      }
      this.updatePathsShown();
      this.updateMarkersShown();
    }
  }"""
if "this.updatePathsShown();" not in text[text.find('processDataUser'):] and "localforage.setItem" in text:
    text = re.sub(old_end_pattern, new_end, text, count=1)

with open(filename, 'w', encoding='utf-8') as f:
    f.write(text)

print("Python repair script completed.")
