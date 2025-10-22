import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DeviceMap = ({ device }) => {
  const position = [
    parseFloat(device.latitude) || 25.276987,
    parseFloat(device.longitude) || 55.296249
  ];

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Device Location
        </h3>
      </div>

      <div className="h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{device.device_name || device.device_id}</p>
                <p className="text-sm text-gray-600">{device.location}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        <p className="flex items-center space-x-2">
          <MapPin className="w-4 h-4" />
          <span>{device.location}</span>
        </p>
        <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">
          Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
        </p>
      </div>
    </div>
  );
};

export default DeviceMap;
