export interface Landmark {
    name: string;
    lat: number;
    lng: number;
    alt: number;
    heading?: number;
    pitch?: number;
}

export interface CityData {
    name: string;
    landmarks: Landmark[];
}

export type WorldMode = 'earth' | 'moon' | 'mars';

export const CITIES: CityData[] = [
    {
        name: 'Austin, TX',
        landmarks: [
            { name: 'Texas State Capitol', lat: 30.2747, lng: -97.7403, alt: 800, pitch: -35 },
            { name: 'Frost Bank Tower', lat: 30.2672, lng: -97.7431, alt: 600, pitch: -40 },
            { name: 'Lady Bird Lake', lat: 30.2515, lng: -97.7500, alt: 1200, pitch: -30 },
            { name: 'UT Austin Tower', lat: 30.2862, lng: -97.7394, alt: 700, pitch: -35 },
            { name: 'Congress Avenue Bridge', lat: 30.2618, lng: -97.7450, alt: 500, pitch: -45 },
        ],
    },
    {
        name: 'New York, NY',
        landmarks: [
            { name: 'Empire State Building', lat: 40.7484, lng: -73.9857, alt: 800, pitch: -35 },
            { name: 'Statue of Liberty', lat: 40.6892, lng: -74.0445, alt: 1000, pitch: -25 },
            { name: 'Central Park', lat: 40.7829, lng: -73.9654, alt: 2000, pitch: -30 },
            { name: 'Times Square', lat: 40.7580, lng: -73.9855, alt: 600, pitch: -40 },
            { name: 'Brooklyn Bridge', lat: 40.7061, lng: -73.9969, alt: 800, pitch: -35 },
        ],
    },
    {
        name: 'London, UK',
        landmarks: [
            { name: 'Big Ben', lat: 51.5007, lng: -0.1246, alt: 700, pitch: -35 },
            { name: 'Tower Bridge', lat: 51.5055, lng: -0.0754, alt: 600, pitch: -40 },
            { name: 'Buckingham Palace', lat: 51.5014, lng: -0.1419, alt: 800, pitch: -30 },
            { name: 'The Shard', lat: 51.5045, lng: -0.0865, alt: 600, pitch: -35 },
            { name: 'London Eye', lat: 51.5033, lng: -0.1195, alt: 700, pitch: -35 },
        ],
    },
    {
        name: 'Dubai, UAE',
        landmarks: [
            { name: 'Burj Khalifa', lat: 25.1972, lng: 55.2744, alt: 1000, pitch: -30 },
            { name: 'Palm Jumeirah', lat: 25.1124, lng: 55.1390, alt: 5000, pitch: -25 },
            { name: 'Dubai Marina', lat: 25.0805, lng: 55.1403, alt: 1200, pitch: -35 },
            { name: 'Burj Al Arab', lat: 25.1412, lng: 55.1852, alt: 800, pitch: -30 },
            { name: 'Dubai Frame', lat: 25.2350, lng: 55.3004, alt: 700, pitch: -35 },
        ],
    },
    {
        name: 'Tokyo, JP',
        landmarks: [
            { name: 'Tokyo Tower', lat: 35.6586, lng: 139.7454, alt: 700, pitch: -35 },
            { name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7004, alt: 500, pitch: -45 },
            { name: 'Imperial Palace', lat: 35.6852, lng: 139.7528, alt: 1000, pitch: -30 },
            { name: 'Tokyo Skytree', lat: 35.7101, lng: 139.8107, alt: 800, pitch: -30 },
            { name: 'Senso-ji Temple', lat: 35.7148, lng: 139.7967, alt: 600, pitch: -35 },
        ],
    },
    {
        name: 'Moscow, RU',
        landmarks: [
            { name: 'Red Square', lat: 55.7539, lng: 37.6208, alt: 800, pitch: -35 },
            { name: 'Kremlin', lat: 55.7520, lng: 37.6175, alt: 1000, pitch: -30 },
            { name: "St. Basil's Cathedral", lat: 55.7525, lng: 37.6231, alt: 600, pitch: -40 },
            { name: 'Moscow City', lat: 55.7496, lng: 37.5378, alt: 1200, pitch: -30 },
            { name: 'Bolshoi Theatre', lat: 55.7601, lng: 37.6187, alt: 500, pitch: -40 },
        ],
    },
    {
        name: 'Paris, FR',
        landmarks: [
            { name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, alt: 800, pitch: -35 },
            { name: 'Arc de Triomphe', lat: 48.8738, lng: 2.2950, alt: 600, pitch: -40 },
            { name: 'Notre-Dame', lat: 48.8530, lng: 2.3499, alt: 500, pitch: -40 },
            { name: 'Louvre Museum', lat: 48.8606, lng: 2.3376, alt: 700, pitch: -35 },
            { name: 'Sacré-Cœur', lat: 48.8867, lng: 2.3431, alt: 600, pitch: -35 },
        ],
    },
    {
        name: 'Sydney, AU',
        landmarks: [
            { name: 'Sydney Opera House', lat: -33.8568, lng: 151.2153, alt: 600, pitch: -35 },
            { name: 'Harbour Bridge', lat: -33.8523, lng: 151.2108, alt: 800, pitch: -30 },
            { name: 'Bondi Beach', lat: -33.8915, lng: 151.2767, alt: 1000, pitch: -25 },
            { name: 'Darling Harbour', lat: -33.8736, lng: 151.1994, alt: 700, pitch: -35 },
            { name: 'Taronga Zoo', lat: -33.8437, lng: 151.2412, alt: 800, pitch: -30 },
        ],
    },
];

export const MOON_SCENES: CityData[] = [
    {
        name: 'Near Side',
        landmarks: [
            { name: 'Mare Tranquillitatis', lat: 8.5, lng: 31.4, alt: 1800000, pitch: -55 },
            { name: 'Tycho Crater', lat: -43.3, lng: -11.2, alt: 1500000, pitch: -55 },
            { name: 'Copernicus Crater', lat: 9.6, lng: -20.1, alt: 1200000, pitch: -55 },
        ],
    },
    {
        name: 'Polar Regions',
        landmarks: [
            { name: 'Shackleton Crater', lat: -89.9, lng: 0, alt: 1000000, pitch: -70 },
            { name: 'Peary Crater', lat: 88.6, lng: 33.0, alt: 1000000, pitch: -70 },
            { name: 'South Pole Ridge', lat: -88.8, lng: 45.0, alt: 1200000, pitch: -65 },
        ],
    },
];

export const MARS_SCENES: CityData[] = [
    {
        name: 'Volcanic Province',
        landmarks: [
            { name: 'Olympus Mons', lat: 18.65, lng: -133.8, alt: 2400000, pitch: -60 },
            { name: 'Ascraeus Mons', lat: 11.8, lng: -104.0, alt: 1800000, pitch: -60 },
            { name: 'Arsia Mons', lat: -8.4, lng: -120.1, alt: 1800000, pitch: -60 },
        ],
    },
    {
        name: 'Canyons & Basins',
        landmarks: [
            { name: 'Valles Marineris', lat: -14.0, lng: -59.0, alt: 1700000, pitch: -58 },
            { name: 'Gale Crater', lat: -5.4, lng: 137.8, alt: 1500000, pitch: -58 },
            { name: 'Jezero Crater', lat: 18.4, lng: 77.5, alt: 1400000, pitch: -58 },
        ],
    },
];

export const SCENES_BY_WORLD: Record<WorldMode, CityData[]> = {
    earth: CITIES,
    moon: MOON_SCENES,
    mars: MARS_SCENES,
};

export const DATA_FEEDS_BY_WORLD: Record<WorldMode, string[]> = {
    earth: ['OPENSKY', 'USGS', 'ABUSEIPDB', 'WEBCAMERA24', 'LOCAL TRAFFIC MODEL'],
    moon: ['NASA IMAGE LIBRARY', 'LRO PDS', 'LUNAR PDS DATASETS', 'JPL HORIZONS', 'NAIF SPICE', 'ARTEMIS DATA', 'DONKI SPACE WEATHER'],
    mars: ['NASA MARS ROVER PHOTOS', 'INSIGHT WEATHER', 'NASA IMAGE LIBRARY', 'PDS', 'JPL HORIZONS', 'DONKI'],
};

export const STYLE_PRESETS = [
    { id: 'normal', name: 'Normal', icon: '◯', key: '1' },
    { id: 'crt', name: 'CRT', icon: '◉', key: '2' },
    { id: 'nvg', name: 'NVG', icon: '◌', key: '3' },
    { id: 'flir', name: 'FLIR', icon: '◎', key: '4' },
    { id: 'anime', name: 'Anime', icon: '◇', key: '5' },
    { id: 'noir', name: 'Noir', icon: '◆', key: '6' },
    { id: 'snow', name: 'Snow', icon: '□', key: '7' },
    { id: 'ai', name: 'AI', icon: '▣', key: '8' },
] as const;

export type StylePresetId = typeof STYLE_PRESETS[number]['id'];

export const CLASSIFICATION_MARKING = 'TOP SECRET // SI-TK // NOFORN';
export const SYSTEM_ID = 'KH11-4084 OPS-4114';

export const API_ENDPOINTS = {
    BACKEND_HEALTH: '/api/v1/health',
    FLIGHTS_EVENTS: '/api/v1/events/flights',
    EARTHQUAKE_EVENTS: '/api/v1/events/earthquakes',
    TRAFFIC_EVENTS: '/api/v1/events/traffic',
    ALERTS_SUMMARY: '/api/v1/alerts/summary',
    ALERTS: '/api/v1/alerts',
    FEATURES_REGIONS: '/api/v1/features/regions',
    PREDICT_ANOMALY: '/api/v1/predict/anomaly',
    MODEL_METRICS: '/api/v1/model/metrics',
    DDOS_EVENTS: '/api/v1/events/ddos',
    OPENSKY: 'https://opensky-network.org/api/states/all',
    CELESTRAK_TLE: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
    CELESTRAK_STATIONS: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
    USGS_EARTHQUAKES: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
    ABUSEIPDB_BLACKLIST: 'https://api.abuseipdb.com/api/v2/blacklist',
    NASA_MARS_ROVER_PHOTOS: 'https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos',
    NASA_INSIGHT_WEATHER: 'https://api.nasa.gov/insight_weather/',
    NASA_IMAGE_LIBRARY: 'https://images-api.nasa.gov/search',
    NASA_PDS_SEARCH: 'https://pds.nasa.gov/services/search/search',
    JPL_HORIZONS: 'https://ssd.jpl.nasa.gov/api/horizons.api',
    NASA_DONKI_CME: 'https://api.nasa.gov/DONKI/CME',
    NAIF_SPICE: 'https://naif.jpl.nasa.gov/naif/data.html',
};

// Simulated CCTV data (Austin, TX)
export const CCTV_CAMERAS = [
    { id: 'CAM-001', name: 'Congress Ave & 11th St', lat: 30.2747, lng: -97.7426, url: 'https://cctv.austintexas.gov/image/1.jpg' },
    { id: 'CAM-002', name: 'I-35 & Riverside Dr', lat: 30.2496, lng: -97.7375, url: 'https://cctv.austintexas.gov/image/2.jpg' },
    { id: 'CAM-003', name: '6th St & Congress Ave', lat: 30.2676, lng: -97.7431, url: 'https://cctv.austintexas.gov/image/3.jpg' },
    { id: 'CAM-004', name: 'Lamar Blvd & 5th St', lat: 30.2650, lng: -97.7518, url: 'https://cctv.austintexas.gov/image/4.jpg' },
    { id: 'CAM-005', name: 'MoPac & Barton Springs', lat: 30.2610, lng: -97.7710, url: 'https://cctv.austintexas.gov/image/5.jpg' },
    { id: 'CAM-006', name: 'Airport Blvd & I-35', lat: 30.3030, lng: -97.7112, url: 'https://cctv.austintexas.gov/image/6.jpg' },
];

// Simulated traffic road segments
export function generateTrafficParticles(centerLat: number, centerLng: number) {
    const particles: Array<{ id: number; points: Array<{ lat: number; lng: number }> }> = [];
    for (let i = 0; i < 40; i++) {
        const startLat = centerLat + (Math.random() - 0.5) * 0.02;
        const startLng = centerLng + (Math.random() - 0.5) * 0.02;
        const angle = Math.random() * Math.PI * 2;
        const len = Math.random() * 0.005 + 0.001;
        particles.push({
            id: i,
            points: [
                { lat: startLat, lng: startLng },
                { lat: startLat + Math.cos(angle) * len, lng: startLng + Math.sin(angle) * len },
                { lat: startLat + Math.cos(angle) * len * 2, lng: startLng + Math.sin(angle) * len * 2 },
            ],
        });
    }
    return particles;
}
