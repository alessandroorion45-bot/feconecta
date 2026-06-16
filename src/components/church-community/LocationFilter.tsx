import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export interface LocationFilters {
  state: string;
  city: string;
}

interface LocationFilterProps {
  filters: LocationFilters;
  onChange: (filters: LocationFilters) => void;
}

const LocationFilter = ({ filters, onChange }: LocationFilterProps) => {
  const [open, setOpen] = useState(false);

  const activeFiltersCount = [filters.state, filters.city].filter(Boolean).length;

  const clearFilters = () => {
    onChange({ state: "", city: "" });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar por localização
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-popover" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Filtrar por localização
              </h4>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select 
                value={filters.state || "__all__"} 
                onValueChange={(v) => onChange({ ...filters, state: v === "__all__" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-popover">
                  <SelectItem value="__all__">Todos os estados</SelectItem>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Município</Label>
              <Input
                placeholder="Digite o nome da cidade"
                value={filters.city}
                onChange={(e) => onChange({ ...filters, city: e.target.value })}
              />
            </div>

            <Button 
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Aplicar filtros
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Show active filter badges */}
      {filters.state && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {filters.state}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => onChange({ ...filters, state: "" })}
          />
        </Badge>
      )}
      {filters.city && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {filters.city}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => onChange({ ...filters, city: "" })}
          />
        </Badge>
      )}
    </div>
  );
};

export default LocationFilter;
