import { useState, useCallback } from "react";

interface GeolocationState {
  loading: boolean;
  error: string | null;
  location: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    location: null,
    coordinates: null
  });

  const getLocation = useCallback(async (): Promise<string | null> => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocalização não suportada pelo navegador"
      }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Use reverse geocoding to get city name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'pt-BR',
                  'User-Agent': 'RedeDaFe/1.0'
                }
              }
            );

            if (response.ok) {
              const data = await response.json();
              const address = data.address;
              
              // Build location string
              let locationParts: string[] = [];
              
              if (address.city || address.town || address.municipality) {
                locationParts.push(address.city || address.town || address.municipality);
              }
              
              if (address.state) {
                locationParts.push(address.state);
              }

              const locationString = locationParts.join(", ") || null;

              setState({
                loading: false,
                error: null,
                location: locationString,
                coordinates: { latitude, longitude }
              });

              resolve(locationString);
            } else {
              throw new Error("Falha ao obter localização");
            }
          } catch (error) {
            setState({
              loading: false,
              error: "Não foi possível determinar a cidade",
              location: null,
              coordinates: { latitude, longitude }
            });
            resolve(null);
          }
        },
        (error) => {
          let errorMessage = "Erro ao obter localização";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Permissão de localização negada";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Localização indisponível";
              break;
            case error.TIMEOUT:
              errorMessage = "Tempo esgotado ao obter localização";
              break;
          }

          setState({
            loading: false,
            error: errorMessage,
            location: null,
            coordinates: null
          });
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setState({
      loading: false,
      error: null,
      location: null,
      coordinates: null
    });
  }, []);

  return {
    ...state,
    getLocation,
    clearLocation
  };
};
