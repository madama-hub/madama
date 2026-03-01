// MGRS coordinate converter (simplified)
// Converts lat/lng to Military Grid Reference System string

function getLatBand(lat: number): string {
    const bands = 'CDEFGHJKLMNPQRSTUVWX';
    const index = Math.floor((lat + 80) / 8);
    return bands[Math.min(Math.max(index, 0), bands.length - 1)];
}

function get100kId(easting: number, northing: number, zoneNumber: number): string {
    const setParm = (zoneNumber - 1) % 6;
    const colLetters = [
        'ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ',
        'ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ'
    ];
    const rowLetters = [
        'ABCDEFGHJKLMNPQRSTUV', 'FGHJKLMNPQRSTUVABCDE'
    ];

    const col = Math.floor(easting / 100000) - 1;
    const row = Math.floor(northing % 2000000 / 100000);

    const colLetter = colLetters[setParm][col] || 'A';
    const rowLetter = rowLetters[setParm % 2][row] || 'A';

    return colLetter + rowLetter;
}

export function latLngToMGRS(lat: number, lng: number): string {
    if (lat < -80 || lat > 84) {
        return `${lat.toFixed(4)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
    }

    const zoneNumber = Math.floor((lng + 180) / 6) + 1;
    const latBand = getLatBand(lat);

    // Simplified UTM conversion
    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;
    const centralMeridian = ((zoneNumber - 1) * 6 - 180 + 3) * Math.PI / 180;

    const a = 6378137;
    const f = 1 / 298.257223563;
    const e = Math.sqrt(2 * f - f * f);
    const e2 = e * e / (1 - e * e);
    const n = a / Math.sqrt(1 - e * e * Math.sin(latRad) * Math.sin(latRad));
    const t = Math.tan(latRad);
    const c = e2 * Math.cos(latRad) * Math.cos(latRad);
    const aCoef = (lngRad - centralMeridian) * Math.cos(latRad);

    const M = a * (
        (1 - e * e / 4 - 3 * e * e * e * e / 64) * latRad
        - (3 * e * e / 8 + 3 * e * e * e * e / 32) * Math.sin(2 * latRad)
        + (15 * e * e * e * e / 256) * Math.sin(4 * latRad)
    );

    let easting = 0.9996 * n * (aCoef + (1 - t * t + c) * aCoef * aCoef * aCoef / 6) + 500000;
    let northing = 0.9996 * (M + n * t * (aCoef * aCoef / 2 + (5 - t * t + 9 * c + 4 * c * c) * aCoef * aCoef * aCoef * aCoef / 24));

    if (lat < 0) northing += 10000000;

    const gridId = get100kId(easting, northing, zoneNumber);
    const e5 = Math.floor(easting % 100000);
    const n5 = Math.floor(northing % 100000);

    return `${zoneNumber}${latBand} ${gridId} ${String(e5).padStart(5, '0').substring(0, 5)} ${String(n5).padStart(5, '0').substring(0, 5)}`;
}

export function formatLatLng(lat: number, lng: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    const latDeg = Math.floor(Math.abs(lat));
    const latMin = ((Math.abs(lat) - latDeg) * 60).toFixed(2);
    const lngDeg = Math.floor(Math.abs(lng));
    const lngMin = ((Math.abs(lng) - lngDeg) * 60).toFixed(2);
    return `${latDeg}°${latMin}'${latDir} ${lngDeg}°${lngMin}'${lngDir}`;
}
