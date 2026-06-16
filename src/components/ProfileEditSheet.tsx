import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Church, MapPin, Heart, User, AtSign, FileText, Save, X, Loader2, Check, Quote } from "lucide-react";
import { CoverImageUpload } from "./CoverImageUpload";
import { ChurchRoleMinistrySelect } from "./ChurchRoleMinistrySelect";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  username: string;
  full_name: string;
  church_name: string;
  bio: string;
  city: string;
  avatar_url: string;
  cover_image_url: string;
  marital_status: string;
  is_private: boolean;
  profile_quote: string;
  church_role: string | null;
  ministries: string[];
}

interface ProfileEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  profile: ProfileData;
  onProfileUpdate: (profile: ProfileData) => void;
}

const MARITAL_STATUS_OPTIONS = [
  { value: "solteiro", label: "Solteiro" },
  { value: "solteira", label: "Solteira" },
  { value: "casado", label: "Casado" },
  { value: "casada", label: "Casada" },
];

export const ProfileEditSheet = ({
  open,
  onOpenChange,
  userId,
  profile,
  onProfileUpdate,
}: ProfileEditSheetProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>(profile);
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setFormData(profile);
    setUsernameError("");
  }, [profile, open]);

  useEffect(() => {
    if (open && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 150);
    }
  }, [open]);

  // Username format validation
  const validateUsernameFormat = (username: string): string | null => {
    if (!username.trim()) {
      return "Nome de usuário é obrigatório";
    }
    if (username.length < 3) {
      return "Mínimo de 3 caracteres";
    }
    if (username.length > 20) {
      return "Máximo de 20 caracteres";
    }
    if (/\s/.test(username)) {
      return "Não pode conter espaços";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "Use apenas letras, números e underline (_)";
    }
    return null;
  };

  // Check username availability (case-insensitive)
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    // Skip if it's the same as current username (case-insensitive)
    if (username.toLowerCase() === profile.username.toLowerCase()) {
      setUsernameError("");
      return true;
    }

    setCheckingUsername(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .neq("id", userId)
        .maybeSingle();

      if (data) {
        setUsernameError("Este nome de usuário já está em uso. Escolha outro.");
        return false;
      }

      setUsernameError("");
      return true;
    } catch (error) {
      setUsernameError("Erro ao verificar disponibilidade");
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  // Debounced username validation
  const handleUsernameChange = (value: string) => {
    // Sanitize: remove spaces and convert to lowercase for storage
    const sanitized = value.replace(/\s/g, "").toLowerCase();
    setFormData({ ...formData, username: sanitized });

    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    // Format validation first
    const formatError = validateUsernameFormat(sanitized);
    if (formatError) {
      setUsernameError(formatError);
      return;
    }

    // Debounce availability check
    usernameCheckTimeout.current = setTimeout(() => {
      checkUsernameAvailability(sanitized);
    }, 500);
  };

  // Full validation for save
  const validateUsername = async (username: string): Promise<boolean> => {
    const formatError = validateUsernameFormat(username);
    if (formatError) {
      setUsernameError(formatError);
      return false;
    }
    return await checkUsernameAvailability(username);
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast({
        title: "Erro",
        description: "O nome completo é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const isUsernameValid = await validateUsername(formData.username);
    if (!isUsernameValid) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          full_name: formData.full_name,
          church_name: formData.church_name || null,
          bio: formData.bio || null,
          city: formData.city || null,
          marital_status: formData.marital_status || null,
          profile_quote: formData.profile_quote || null,
          church_role: formData.church_role || null,
          ministries: formData.ministries || [],
        } as any)
        .eq("id", userId);

      if (error) throw error;

      onProfileUpdate(formData);
      onOpenChange(false);
      
      toast({
        title: "Alterações salvas com sucesso!",
        description: "Seu perfil foi atualizado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Perfil
          </SheetTitle>
          <SheetDescription>
            Atualize suas informações públicas. Todos poderão ver essas informações.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Cover Image */}
          <CoverImageUpload
            currentUrl={formData.cover_image_url}
            userId={userId}
            onUploadComplete={(url) => setFormData({ ...formData, cover_image_url: url || "" })}
            variant="inline"
          />

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-full-name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nome Completo *
            </Label>
            <Input
              id="edit-full-name"
              ref={firstInputRef}
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Seu nome completo"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="edit-username" className="flex items-center gap-2">
              <AtSign className="h-4 w-4 text-muted-foreground" />
              Nome de Usuário *
              <span className="text-xs text-muted-foreground ml-auto">3-20 caracteres</span>
            </Label>
            <div className="relative">
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="seu_username"
                maxLength={20}
                className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10 ${
                  usernameError 
                    ? "border-destructive focus:ring-destructive/20" 
                    : formData.username && !checkingUsername && formData.username.length >= 3
                      ? "border-emerald-500 focus:ring-emerald-500/20"
                      : ""
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : formData.username && !usernameError && formData.username.length >= 3 ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : null}
              </div>
            </div>
            {usernameError ? (
              <p className="text-xs text-destructive">{usernameError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Apenas letras, números e underline (_). Sem espaços.
              </p>
            )}
          </div>

          {/* Church */}
          <div className="space-y-2">
            <Label htmlFor="edit-church" className="flex items-center gap-2">
              <Church className="h-4 w-4 text-muted-foreground" />
              Igreja
            </Label>
            <Input
              id="edit-church"
              value={formData.church_name}
              onChange={(e) => setFormData({ ...formData, church_name: e.target.value })}
              placeholder="Nome da sua igreja"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="edit-city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Cidade
            </Label>
            <Input
              id="edit-city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Sua cidade"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="edit-bio" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Bio
            </Label>
            <Textarea
              id="edit-bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Conte um pouco sobre você..."
              rows={3}
              maxLength={300}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/300
            </p>
          </div>

          {/* Profile Quote */}
          <div className="space-y-2">
            <Label htmlFor="edit-quote" className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-muted-foreground" />
              Frase de Perfil
              <span className="text-xs text-muted-foreground ml-auto">máx. 120 caracteres</span>
            </Label>
            <Input
              id="edit-quote"
              value={formData.profile_quote || ""}
              onChange={(e) => setFormData({ ...formData, profile_quote: e.target.value })}
              placeholder="Digite sua frase inspiradora…"
              maxLength={120}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground text-right">
              {(formData.profile_quote || "").length}/120
            </p>
          </div>

          {/* Marital Status */}
          <div className="space-y-2">
            <Label htmlFor="edit-marital-status" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              Estado Civil
            </Label>
            <Select
              value={formData.marital_status || ""}
              onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
            >
              <SelectTrigger id="edit-marital-status" className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {MARITAL_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Church Role & Ministries */}
          <ChurchRoleMinistrySelect
            churchRole={formData.church_role}
            ministries={formData.ministries}
            onChurchRoleChange={(role) => setFormData({ ...formData, church_role: role })}
            onMinistriesChange={(ministries) => setFormData({ ...formData, ministries })}
          />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="flex-1 gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gap-2 bg-gradient-primary text-primary-foreground shadow-glow"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
