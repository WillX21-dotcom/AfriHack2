export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracy: number;
  addressSuggestion?: string;
}

export async function getCurrentCoordinates(): Promise<GeoCoordinate> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: -26.1076,
        longitude: 28.0567,
        accuracy: 10,
        addressSuggestion: 'Corner Rivonia Rd & Sandton Dr, Sandton, Johannesburg',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          addressSuggestion: 'Sandton Financial District, Johannesburg',
        });
      },
      () => {
        // Fallback to Sandton location
        resolve({
          latitude: -26.1076,
          longitude: 28.0567,
          accuracy: 15,
          addressSuggestion: 'Rivonia Road, Sandton, Johannesburg',
        });
      },
      { timeout: 4000 }
    );
  });
}
