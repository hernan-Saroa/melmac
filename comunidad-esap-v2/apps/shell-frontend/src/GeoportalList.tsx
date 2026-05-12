import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchLegacy } from './lib/api';
import { MapIcon, Users, Smartphone, MapPin, Loader2, Navigation } from 'lucide-react';

// Fix para iconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customUserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customProjectIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface GeoUser {
  id: number;
  first_name: string;
  first_last_name: string;
  email: string;
}

interface UserLocation {
  user_id: number;
  latitude: number;
  longitude: number;
  creation_date: string;
}

export default function GeoportalList() {
  const [activeLayer, setActiveLayer] = useState<'users' | 'projects' | 'all'>('users');
  const [mapCenter] = useState<[number, number]>([4.600868, -74.08175]); // Bogotá
  const [mapZoom] = useState(10);

  // Fetch Users Geo Data
  const { data: usersGeo, isLoading: loadingUsers } = useQuery({
    queryKey: ['geo_users'],
    queryFn: async () => {
      const response = await fetchLegacy('/user_geo_list/', { method: 'POST', body: JSON.stringify({}) });
      return response || { data: [], last: {} };
    }
  });

  // Fetch Projects/Addresses
  const { data: projectsGeo, isLoading: loadingProjects } = useQuery({
    queryKey: ['geo_projects'],
    queryFn: async () => {
      const response = await fetchLegacy('/geoportal/?list=1');
      return response.data || [];
    }
  });

  const renderUserMarkers = () => {
    if (!usersGeo || !usersGeo.last) return null;
    return Object.values(usersGeo.last as Record<string, UserLocation>).map((loc) => {
      if (!loc.latitude || !loc.longitude) return null;
      
      const userInfo = (usersGeo.data as GeoUser[]).find(u => u.id === loc.user_id);
      
      return (
        <Marker key={`user-${loc.user_id}`} position={[loc.latitude, loc.longitude]} icon={customUserIcon}>
          <Popup className="rounded-xl">
            <div className="p-1">
              <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                {userInfo ? `${userInfo.first_name} ${userInfo.first_last_name}` : 'Usuario en Terreno'}
              </h3>
              <p className="text-xs text-slate-500 mb-2">{userInfo?.email}</p>
              <div className="text-[10px] bg-slate-50 p-2 rounded border border-slate-100">
                <span className="font-semibold text-slate-600">Última captura:</span><br/>
                {new Date(loc.creation_date).toLocaleString()}
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  };

  const renderProjectMarkers = () => {
    if (!projectsGeo) return null;
    let markers: any[] = [];
    
    projectsGeo.forEach((project: any) => {
      if (project.json_path && project.json_path.length > 0) {
        project.json_path.forEach((address: any, idx: number) => {
          if (address.lat && address.lon) {
            markers.push(
              <Marker key={`proj-${project.id}-${idx}`} position={[address.lat, address.lon]} icon={customProjectIcon}>
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      {address.name || 'Punto de Proyecto'}
                    </h3>
                    <p className="text-xs text-slate-500">{address.address}</p>
                  </div>
                </Popup>
              </Marker>
            );
          }
        });
      }
    });
    return markers;
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      
      {/* Sidebar Overlay Flotante */}
      <div className="absolute top-6 left-6 z-[400] w-80 bg-white/90 backdrop-blur-md border border-white/40 shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-left-10 duration-500">
        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-indigo-400" />
            GeoPortal Cartográfico
          </h2>
          <p className="text-xs text-slate-300 mt-1">Control satelital de recursos en campo</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Capas Activas</h3>
            
            <button 
              onClick={() => setActiveLayer('all')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeLayer === 'all' ? 'bg-indigo-50 border-indigo-200 border text-indigo-700' : 'bg-white border border-slate-100 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <Navigation className={`w-5 h-5 ${activeLayer === 'all' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="font-medium text-sm">Vista Global</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveLayer('users')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeLayer === 'users' ? 'bg-violet-50 border-violet-200 border text-violet-700' : 'bg-white border border-slate-100 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-5 h-5 ${activeLayer === 'users' ? 'text-violet-600' : 'text-slate-400'}`} />
                <div className="text-left">
                  <span className="font-medium text-sm block">Usuarios en Terreno</span>
                  {loadingUsers && <span className="text-[10px] flex items-center gap-1 text-slate-400"><Loader2 className="w-3 h-3 animate-spin"/> Sincronizando...</span>}
                </div>
              </div>
              {usersGeo?.last && <span className="text-xs font-bold bg-violet-100 text-violet-600 py-1 px-2 rounded-lg">{Object.keys(usersGeo.last).length}</span>}
            </button>

            <button 
              onClick={() => setActiveLayer('projects')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeLayer === 'projects' ? 'bg-emerald-50 border-emerald-200 border text-emerald-700' : 'bg-white border border-slate-100 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <MapPin className={`w-5 h-5 ${activeLayer === 'projects' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="text-left">
                  <span className="font-medium text-sm block">Puntos de Proyecto</span>
                  {loadingProjects && <span className="text-[10px] flex items-center gap-1 text-slate-400"><Loader2 className="w-3 h-3 animate-spin"/> Sincronizando...</span>}
                </div>
              </div>
              {projectsGeo && <span className="text-xs font-bold bg-emerald-100 text-emerald-600 py-1 px-2 rounded-lg">{projectsGeo.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        
        {/* Renderizado Condicional de Capas */}
        {(activeLayer === 'all' || activeLayer === 'users') && renderUserMarkers()}
        {(activeLayer === 'all' || activeLayer === 'projects') && renderProjectMarkers()}
        
      </MapContainer>
    </div>
  );
}
