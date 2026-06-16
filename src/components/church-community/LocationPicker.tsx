import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation } from "lucide-react";

// Brazilian states
const BRAZILIAN_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
];

interface LocationData {
  country: string;
  state: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface LocationPickerProps {
  value: LocationData;
  onChange: (data: LocationData) => void;
}

const LocationPicker = ({ value, onChange }: LocationPickerProps) => {
  const [isLocating, setIsLocating] = useState(false);

  const handleChange = (field: keyof LocationData, fieldValue: string | number | undefined) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        onChange({
          ...value,
          latitude,
          longitude,
        });
        
        // Try to reverse geocode using a free service
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`
          );
          const data = await response.json();
          
          if (data.address) {
            onChange({
              ...value,
              latitude,
              longitude,
              city: data.address.city || data.address.town || data.address.municipality || value.city,
              state: data.address.state || value.state,
              address: data.display_name || value.address,
            });
          }
        } catch (error) {
          console.log("Geocoding error:", error);
        }
        
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-4">
      {/* Country */}
      <div className="space-y-2">
        <Label>País</Label>
        <Select value={value.country} onValueChange={(v) => handleChange("country", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o país" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Brasil">🇧🇷 Brasil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* State */}
      <div className="space-y-2">
        <Label>Estado *</Label>
        <Select value={value.state} onValueChange={(v) => handleChange("state", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o estado" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {BRAZILIAN_STATES.map((state) => (
              <SelectItem key={state.code} value={state.name}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">Município *</Label>
        <Input
          id="city"
          value={value.city}
          onChange={(e) => handleChange("city", e.target.value)}
          placeholder="Nome da cidade"
        />
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Endereço completo *</Label>
        <Input
          id="address"
          value={value.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Rua, número, bairro..."
        />
      </div>

      {/* Geolocation */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-sm">Localização no mapa (opcional)</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="flex-1"
          >
            {isLocating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                Localizando...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Usar minha localização
              </>
            )}
          </Button>
        </div>
        
        {value.latitude && value.longitude && (
          <div className="mt-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-green-500" />
              <span>
                Localização definida: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              </span>
            </div>
            {/* Simple map preview using OpenStreetMap */}
            <div className="mt-2 rounded-md overflow-hidden border">
              <iframe
                title="Localização no mapa"
                width="100%"
                height="150"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${value.longitude - 0.01},${value.latitude - 0.01},${value.longitude + 0.01},${value.latitude + 0.01}&layer=mapnik&marker=${value.latitude},${value.longitude}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
