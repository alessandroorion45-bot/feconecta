import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Loader2, ExternalLink } from "lucide-react";
import { fetchBrazilianStates, fetchCitiesByState, type IbgeState, type IbgeCity } from "@/lib/ibge";
import { fetchAddressByCep, isValidCep } from "@/lib/viacep";
import { isValidGoogleMapsLink, getEmbeddableMapsUrl } from "@/lib/googleMapsLink";
import { useToast } from "@/hooks/use-toast";

export interface LocationData {
  country: string;
  state: string;
  city: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  address: string; // legado: endereço completo concatenado, mantido por compatibilidade
  mapsLink: string;
  latitude?: number;
  longitude?: number;
}

interface LocationPickerProps {
  value: LocationData;
  onChange: (data: LocationData) => void;
}

const LocationPicker = ({ value, onChange }: LocationPickerProps) => {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [states, setStates] = useState<IbgeState[]>([]);
  const [cities, setCities] = useState<IbgeCity[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [lookingUpCep, setLookingUpCep] = useState(false);
  const lastStateLoaded = useRef<string | null>(null);

  const handleChange = (field: keyof LocationData, fieldValue: string | number | undefined) => {
    onChange({ ...value, [field]: fieldValue });
  };

  // Carrega a lista de estados do IBGE uma vez
  useEffect(() => {
    fetchBrazilianStates()
      .then(setStates)
      .catch(() => {
        // Sem internet/IBGE fora do ar — usuário ainda digita a cidade livremente
      });
  }, []);

  // Ao trocar de estado, carrega os municípios daquele estado
  useEffect(() => {
    const uf = states.find((s) => s.nome === value.state)?.sigla;
    if (!uf || lastStateLoaded.current === uf) return;
    lastStateLoaded.current = uf;
    setLoadingCities(true);
    fetchCitiesByState(uf)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.state, states]);

  const handleCepBlur = async () => {
    if (!value.zipCode || !isValidCep(value.zipCode)) return;
    setLookingUpCep(true);
    try {
      const result = await fetchAddressByCep(value.zipCode);
      if (!result) {
        toast({ title: "CEP não encontrado", variant: "destructive" });
        return;
      }
      const matchedState = states.find((s) => s.sigla === result.uf)?.nome || value.state;
      onChange({
        ...value,
        street: result.logradouro || value.street,
        neighborhood: result.bairro || value.neighborhood,
        city: result.localidade || value.city,
        state: matchedState,
      });
      toast({ title: "📍 Endereço encontrado!", description: "Confira e complete o número." });
    } catch {
      toast({ title: "Erro ao buscar CEP", description: "Tente novamente ou preencha manualmente.", variant: "destructive" });
    } finally {
      setLookingUpCep(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        onChange({ ...value, latitude, longitude });
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
              street: data.address.road || value.street,
              neighborhood: data.address.suburb || data.address.neighbourhood || value.neighborhood,
            });
          }
        } catch (error) {
          console.log("Geocoding error:", error);
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const mapsLinkValid = value.mapsLink ? isValidGoogleMapsLink(value.mapsLink) : true;
  const embeddableUrl = value.mapsLink && isValidGoogleMapsLink(value.mapsLink) ? getEmbeddableMapsUrl(value.mapsLink) : null;

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

      <div className="grid grid-cols-2 gap-3">
        {/* State */}
        <div className="space-y-2">
          <Label>Estado *</Label>
          <Select value={value.state} onValueChange={(v) => handleChange("state", v)}>
            <SelectTrigger>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {states.map((state) => (
                <SelectItem key={state.id} value={state.nome}>
                  {state.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">Município *</Label>
          {cities.length > 0 ? (
            <Select value={value.city} onValueChange={(v) => handleChange("city", v)} disabled={loadingCities}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCities ? "Carregando..." : "Selecione"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.nome}>
                    {city.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="city"
              value={value.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="Nome da cidade"
            />
          )}
        </div>
      </div>

      {/* CEP */}
      <div className="space-y-2">
        <Label htmlFor="zip">CEP</Label>
        <div className="relative">
          <Input
            id="zip"
            value={value.zipCode}
            onChange={(e) => handleChange("zipCode", e.target.value)}
            onBlur={handleCepBlur}
            placeholder="00000-000"
            maxLength={9}
          />
          {lookingUpCep && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">Digite o CEP pra preencher rua e bairro automaticamente.</p>
      </div>

      {/* Rua / Número */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="street">Rua *</Label>
          <Input
            id="street"
            value={value.street}
            onChange={(e) => handleChange("street", e.target.value)}
            placeholder="Av. Central"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="number">Número *</Label>
          <Input
            id="number"
            value={value.number}
            onChange={(e) => handleChange("number", e.target.value)}
            placeholder="123"
          />
        </div>
      </div>

      {/* Bairro / Complemento */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            value={value.neighborhood}
            onChange={(e) => handleChange("neighborhood", e.target.value)}
            placeholder="Centro"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={value.complement}
            onChange={(e) => handleChange("complement", e.target.value)}
            placeholder="Sala 2, fundos..."
          />
        </div>
      </div>

      {/* Google Maps link */}
      <div className="space-y-2">
        <Label htmlFor="maps-link">Link da localização (Google Maps)</Label>
        <Input
          id="maps-link"
          value={value.mapsLink}
          onChange={(e) => handleChange("mapsLink", e.target.value)}
          placeholder="https://maps.app.goo.gl/..."
          className={!mapsLinkValid ? "border-destructive" : ""}
        />
        {!mapsLinkValid && (
          <p className="text-xs text-destructive">
            Cole um link do Google Maps (maps.google.com, goo.gl/maps ou maps.app.goo.gl).
          </p>
        )}
        {value.mapsLink && mapsLinkValid && (
          <div className="space-y-2">
            <Button type="button" variant="outline" size="sm" asChild className="gap-1.5">
              <a href={value.mapsLink} target="_blank" rel="noopener noreferrer">
                <MapPin className="h-4 w-4" />
                Ver localização
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            {embeddableUrl && (
              <div className="rounded-md overflow-hidden border">
                <iframe title="Mapa da igreja" width="100%" height="180" style={{ border: 0 }} loading="lazy" src={embeddableUrl} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Geolocation (fallback opcional) */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-sm">Ou usar minha localização atual</Label>
        <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation} disabled={isLocating} className="w-full">
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

        {value.latitude && value.longitude && !embeddableUrl && (
          <div className="mt-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-green-500" />
              <span>
                Localização definida: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              </span>
            </div>
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
