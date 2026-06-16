import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, AlertCircle } from "lucide-react";
import { SOUTH_AMERICAN_COUNTRIES, getLanguageByCountry, getMinAgeByCountry, useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CountrySelectionModalProps {
  open: boolean;
  onComplete: () => void;
}

export function CountrySelectionModal({ open, onComplete }: CountrySelectionModalProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();

  const calculateAge = (birthDateStr: string): number => {
    const today = new Date();
    const birth = new Date(birthDateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const validateAge = (birthDateStr: string, countryCode: string): { valid: boolean; minAge: number } => {
    const minAge = getMinAgeByCountry(countryCode);
    const age = calculateAge(birthDateStr);
    return { valid: age >= minAge, minAge };
  };

  const handleComplete = async () => {
    // Validações
    const validationErrors: Record<string, string> = {};

    if (!selectedCountry) {
      validationErrors.country = language === 'pt' ? "Por favor, selecione seu país." :
                                  language === 'es' ? "Por favor, selecciona tu país." :
                                  language === 'nl' ? "Selecteer alstublieft uw land." :
                                  "Please select your country.";
    }

    if (!birthDate) {
      validationErrors.birthDate = language === 'pt' ? "Data de nascimento é obrigatória." :
                                    language === 'es' ? "Fecha de nacimiento es requerida." :
                                    language === 'nl' ? "Geboortedatum is verplicht." :
                                    "Date of birth is required.";
    } else if (selectedCountry) {
      const ageValidation = validateAge(birthDate, selectedCountry);
      if (!ageValidation.valid) {
        validationErrors.birthDate = language === 'pt' ? `Você deve ter pelo menos ${ageValidation.minAge} anos.` :
                                      language === 'es' ? `Debes tener al menos ${ageValidation.minAge} años.` :
                                      language === 'nl' ? `Je moet minstens ${ageValidation.minAge} jaar oud zijn.` :
                                      `You must be at least ${ageValidation.minAge} years old.`;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not found");
      }

      // Atualizar idioma baseado no país
      const newLanguage = getLanguageByCountry(selectedCountry);
      setLanguage(newLanguage);

      // Atualizar perfil do usuário
      const { error } = await supabase
        .from("profiles")
        .update({
          country: selectedCountry,
          preferred_language: newLanguage,
          birth_date: birthDate,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: language === 'pt' ? "Configuração completa!" :
               language === 'es' ? "¡Configuración completa!" :
               language === 'nl' ? "Configuratie voltooid!" :
               "Setup complete!",
        description: language === 'pt' ? "Seu perfil foi configurado com sucesso." :
                     language === 'es' ? "Tu perfil se ha configurado correctamente." :
                     language === 'nl' ? "Uw profiel is succesvol geconfigureerd." :
                     "Your profile has been set successfully.",
      });

      onComplete();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: language === 'pt' ? "Erro ao salvar" :
               language === 'es' ? "Error al guardar" :
               language === 'nl' ? "Fout bij opslaan" :
               "Error saving",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto p-3 w-fit rounded-xl bg-primary mb-3">
            <Globe className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center">
            {language === 'pt' ? 'Selecione seu país' :
             language === 'es' ? 'Selecciona tu país' :
             language === 'nl' ? 'Selecteer je land' :
             'Select your country'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === 'pt' ? 'Isso nos ajuda a personalizar sua experiência' :
             language === 'es' ? 'Esto nos ayuda a personalizar tu experiencia' :
             language === 'nl' ? 'Dit helpt ons je ervaring te personaliseren' :
             'This helps us personalize your experience'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="country">
              {language === 'pt' ? 'País' :
               language === 'es' ? 'País' :
               language === 'nl' ? 'Land' :
               'Country'} *
            </Label>
            <Select value={selectedCountry} onValueChange={(value) => {
              setSelectedCountry(value);
              setErrors((prev) => ({ ...prev, country: '' }));
            }}>
              <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                <SelectValue
                  placeholder={
                    language === 'pt' ? 'Selecione seu país' :
                    language === 'es' ? 'Selecciona tu país' :
                    language === 'nl' ? 'Selecteer je land' :
                    'Select your country'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {SOUTH_AMERICAN_COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <div className="flex items-center gap-1 text-sm text-destructive mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.country}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {language === 'pt' ? 'O idioma será ajustado automaticamente baseado no seu país' :
               language === 'es' ? 'El idioma se ajustará automáticamente según tu país' :
               language === 'nl' ? 'De taal wordt automatisch aangepast op basis van je land' :
               'Language will be automatically adjusted based on your country'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth-date">
              {language === 'pt' ? 'Data de Nascimento' :
               language === 'es' ? 'Fecha de Nacimiento' :
               language === 'nl' ? 'Geboortedatum' :
               'Date of Birth'} *
            </Label>
            <Input
              id="birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => {
                setBirthDate(e.target.value);
                setErrors((prev) => ({ ...prev, birthDate: '' }));
              }}
              className={errors.birthDate ? "border-destructive" : ""}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {errors.birthDate && (
              <div className="flex items-center gap-1 text-sm text-destructive mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.birthDate}</span>
              </div>
            )}
            {selectedCountry && (
              <p className="text-xs text-muted-foreground">
                {language === 'pt' ? `Idade mínima: ${getMinAgeByCountry(selectedCountry)} anos` :
                 language === 'es' ? `Edad mínima: ${getMinAgeByCountry(selectedCountry)} años` :
                 language === 'nl' ? `Minimumleeftijd: ${getMinAgeByCountry(selectedCountry)} jaar` :
                 `Minimum age: ${getMinAgeByCountry(selectedCountry)} years`}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleComplete}
          disabled={loading || !selectedCountry || !birthDate}
          className="w-full"
        >
          {loading
            ? (language === 'pt' ? 'Salvando...' :
               language === 'es' ? 'Guardando...' :
               language === 'nl' ? 'Opslaan...' :
               'Saving...')
            : (language === 'pt' ? 'Continuar' :
               language === 'es' ? 'Continuar' :
               language === 'nl' ? 'Doorgaan' :
               'Continue')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
