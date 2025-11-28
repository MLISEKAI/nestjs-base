export interface GoogleGeocodeAPIResponse {
  results: GoogleGeocodeResult[];
  status: string;
  next_page_token?: string;
}

export interface GoogleGeocodeResult {
  address_components?: GoogleAddressComponent[];
  formatted_address?: string;
  geometry: GoogleGeometry;
  navigation_points?: GoogleNavigationPoint[];
  place_id: string;
  types: string[];
  name?: string;
  vicinity?: string;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
}

export interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GoogleGeometry {
  bounds?: GoogleBounds;
  location: GoogleLatLng;
  location_type: string;
  viewport: GoogleBounds;
}

export interface GoogleBounds {
  northeast: GoogleLatLng;
  southwest: GoogleLatLng;
}

export interface GoogleLatLng {
  lat: number;
  lng: number;
}

export interface GoogleNavigationPoint {
  location: {
    latitude: number;
    longitude: number;
  };
  restricted_travel_modes: string[];
}
