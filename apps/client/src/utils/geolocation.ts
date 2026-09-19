export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * The device's real position. Rejects (with a user-readable message) when location is unavailable
 * or denied, rather than inventing a location.
 */
export function getCurrentCoordinates(): Promise<GeoCoordinate> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not available on this device. Please type the location instead.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? 'Location permission was denied. Please type the location instead.'
              : 'We could not determine your location. Please type it instead.'
          )
        ),
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

export function describeCoordinates(c: GeoCoordinate): string {
  return `GPS ${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)} (accuracy ±${Math.round(c.accuracy)} m)`;
}
