import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CountrySelectionModal } from "@/components/CountrySelectionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Globe, WifiOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { 
  emailSchema, 
  passwordSchema, 
  loginPasswordSchema, 
  usernameSchema, 
  fullNameSchema,
  validateField 
} from "@/lib/validation";
import { 
  SOUTH_AMERICAN_COUNTRIES, 
  getLanguageByCountry, 
  getMinAgeByCountry,
  useLanguage,
  type Language
} from "@/contexts/LanguageContext";

// Authentication with retry and backoff
const authWithRetry = async <T,>(
  operation: () => Promise<{ data: T | null; error: any }>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  timeout: number = 15000
): Promise<{ data: T | null; error: any; attempts: number; isTimeout: boolean; isNetworkError: boolean }> => {
  let lastError: any = null;
  let attempts = 0;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts = attempt + 1;
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), timeout)
      );
      
      // Race operation against timeout
      const result = await Promise.race([operation(), timeoutPromise]) as { data: T | null; error: any };
      
      // If no error, return success
      if (!result.error) {
        return { ...result, attempts, isTimeout: false, isNetworkError: false };
      }
      
      // Check if error is retryable
      const isRetryable = 
        result.error?.message?.includes('fetch') ||
        result.error?.message?.includes('network') ||
        result.error?.status === 503 ||
        result.error?.status === 429;
      
      if (!isRetryable || attempt === maxRetries) {
        return { ...result, attempts, isTimeout: false, isNetworkError: false };
      }
      
      lastError = result.error;
      
    } catch (err: any) {
      const isTimeout = err?.message === 'TIMEOUT';
      const isNetworkError = err?.message?.includes('fetch') || 
                             err?.message?.includes('Failed to fetch') ||
                             err?.name === 'TypeError';
      
      if (attempt === maxRetries) {
        return { 
          data: null, 
          error: err, 
          attempts, 
          isTimeout, 
          isNetworkError 
        };
      }
      
      lastError = err;
    }
    
    // Exponential backoff before retry
    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { 
    data: null, 
    error: lastError, 
    attempts, 
    isTimeout: false, 
    isNetworkError: true 
  };
};

// Network status detection
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { t, setLanguage, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [birthDate, setBirthDate] = useState("");
  const [showCountryModal, setShowCountryModal] = useState(false);

  // Network status detection
  const isOnline = useNetworkStatus();

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Detectar login com Google e verificar se precisa selecionar país
  useEffect(() => {
    const checkGoogleAuthCallback = async () => {
      try {
        console.log('[Auth] Processando OAuth callback...');

        // Add timeout (15s para conexões lentas)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 15000)
        );

        const userPromise = supabase.auth.getUser();

        const { data: { user } } = await Promise.race([
          userPromise,
          timeoutPromise
        ]) as Awaited<ReturnType<typeof supabase.auth.getUser>>;

        if (user) {
          console.log('[Auth] Usuário autenticado via OAuth:', user.email);
          const provider = user.app_metadata?.provider;

          if (provider === 'google') {
            const profilePromise = supabase
              .from('profiles')
              .select('country')
              .eq('id', user.id)
              .maybeSingle();

            const { data: profile } = await Promise.race([
              profilePromise,
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 15000))
            ]) as Awaited<ReturnType<typeof profilePromise>>;

            if (!profile?.country) {
              console.log('[Auth] País não definido, mostrando modal');
              setShowCountryModal(true);
            } else {
              console.log('[Auth] Redirecionando para /feed');
              navigate('/feed', { replace: true });
            }
          } else {
            console.log('[Auth] Redirecionando para /feed (não-Google)');
            navigate('/feed', { replace: true });
          }
        } else {
          console.log('[Auth] Nenhum usuário encontrado após OAuth callback');
        }
      } catch (error: any) {
        console.error('Error checking Google auth:', error);
        // On timeout, just continue - don't block user
        if (error?.message === 'TIMEOUT') {
          console.warn('Google auth check timeout - continuing anyway');
        }
      }
    };

    // Detectar AMBOS: hash (#access_token) E query parameter (?code=)
    const hash = window.location.hash;
    const search = window.location.search;
    const hasAccessToken = hash && hash.includes('access_token');
    const hasCode = search && search.includes('code=');

    if (hasAccessToken || hasCode) {
      console.log('[Auth] OAuth callback detectado:', hasAccessToken ? 'access_token' : 'code');
      // Dar tempo para o Supabase processar o code automaticamente
      setTimeout(() => {
        checkGoogleAuthCallback();
      }, 500);
    }
  }, [navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/feed');
    }
  }, [authLoading, user, navigate]);
  
  // Show detailed error messages based on error type
  const getErrorMessage = useCallback((
    isTimeout: boolean, 
    isNetworkError: boolean, 
    attempts: number
  ) => {
    if (!isOnline) {
      return {
        title: language === 'pt' ? "Sem conexão" : 
               language === 'es' ? "Sin conexión" :
               language === 'nl' ? "Geen verbinding" :
               "No connection",
        description: language === 'pt' ? "Você está offline. Verifique sua conexão com a internet." :
                     language === 'es' ? "Estás sin conexión. Verifica tu conexión a internet." :
                     language === 'nl' ? "Je bent offline. Controleer je internetverbinding." :
                     "You're offline. Check your internet connection."
      };
    }
    
    if (isTimeout) {
      return {
        title: language === 'pt' ? "Servidor lento" : 
               language === 'es' ? "Servidor lento" :
               language === 'nl' ? "Trage server" :
               "Server slow",
        description: language === 'pt' ? `Tentamos ${attempts}x mas o servidor está demorando. Tente novamente em alguns segundos.` :
                     language === 'es' ? `Intentamos ${attempts}x pero el servidor está lento. Intenta de nuevo en unos segundos.` :
                     language === 'nl' ? `We probeerden ${attempts}x maar de server is traag. Probeer het over enkele seconden opnieuw.` :
                     `We tried ${attempts}x but server is slow. Try again in a few seconds.`
      };
    }
    
    if (isNetworkError) {
      return {
        title: language === 'pt' ? "Erro de rede" : 
               language === 'es' ? "Error de red" :
               language === 'nl' ? "Netwerkfout" :
               "Network error",
        description: language === 'pt' ? "Não foi possível conectar ao servidor. Verifique sua internet." :
                     language === 'es' ? "No se pudo conectar al servidor. Verifica tu internet." :
                     language === 'nl' ? "Kan geen verbinding maken met de server. Controleer je internet." :
                     "Could not connect to server. Check your internet."
      };
    }
    
    return {
      title: language === 'pt' ? "Erro de conexão" : 
             language === 'es' ? "Error de conexión" :
             language === 'nl' ? "Verbindingsfout" :
             "Connection error",
      description: language === 'pt' ? "Verifique sua internet e tente novamente." :
                   language === 'es' ? "Verifica tu internet e intenta de nuevo." :
                   language === 'nl' ? "Controleer je internet en probeer opnieuw." :
                   "Check your internet and try again."
    };
  }, [language, isOnline]);

  // Update language when country changes
  useEffect(() => {
    if (selectedCountry) {
      const newLang = getLanguageByCountry(selectedCountry);
      setLanguage(newLang);
    }
  }, [selectedCountry, setLanguage]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

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

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("signup-email") as string).trim();
    const password = formData.get("signup-password") as string;
    const username = (formData.get("username") as string).trim();
    const fullName = (formData.get("full-name") as string).trim();

    // Validate all fields
    const validationErrors: Record<string, string> = {};

    // Country validation
    if (!selectedCountry) {
      validationErrors.country = t('auth.selectCountry');
    }

    // Birth date validation
    if (!birthDate) {
      validationErrors.birthDate = language === 'pt' ? 'Data de nascimento é obrigatória' : 
                                   language === 'es' ? 'Fecha de nacimiento es requerida' :
                                   language === 'nl' ? 'Geboortedatum is verplicht' :
                                   'Date of birth is required';
    } else if (selectedCountry) {
      const ageValidation = validateAge(birthDate, selectedCountry);
      if (!ageValidation.valid) {
        validationErrors.birthDate = t('auth.ageError') + '. ' + t('auth.minAge', { age: ageValidation.minAge });
      }
    }

    const emailValidation = validateField(emailSchema, email);
    if (!emailValidation.valid) {
      validationErrors.email = emailValidation.error!;
    }

    const passwordValidation = validateField(passwordSchema, password);
    if (!passwordValidation.valid) {
      validationErrors.password = passwordValidation.error!;
    }

    const usernameValidation = validateField(usernameSchema, username);
    if (!usernameValidation.valid) {
      validationErrors.username = usernameValidation.error!;
    }

    const fullNameValidation = validateField(fullNameSchema, fullName);
    if (!fullNameValidation.valid) {
      validationErrors.fullName = fullNameValidation.error!;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    // Sanitize username
    const sanitizedUsername = usernameValidation.data as string;

    try {
      // Timeout de 15 segundos para conexões lentas
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 15000)
      );

      // Check if username already exists (case-insensitive)
      const usernameCheck = supabase
        .from("profiles")
        .select("username")
        .ilike("username", sanitizedUsername)
        .maybeSingle();

      const { data: existingProfile } = await Promise.race([usernameCheck, timeoutPromise]) as { data: any };

      if (existingProfile) {
        setErrors({ username: language === 'pt' ? "Este nome de usuário já está em uso. Escolha outro." :
                              language === 'es' ? "Este nombre de usuario ya está en uso. Elige otro." :
                              language === 'nl' ? "Deze gebruikersnaam is al in gebruik. Kies een andere." :
                              "This username is already taken. Choose another." });
        return;
      }

      const preferredLanguage = getLanguageByCountry(selectedCountry);

      const createTimeout = () => new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 15000)
      );

      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: sanitizedUsername,
            full_name: fullName,
            country: selectedCountry,
            preferred_language: preferredLanguage,
            birth_date: birthDate,
          },
        },
      });

      const { data: signUpData, error: signUpError } = await Promise.race([
        signUpPromise,
        createTimeout(),
      ]) as { data: any; error: any };

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setErrors({ email: language === 'pt' ? "Este email já está cadastrado. Tente fazer login." :
                            language === 'es' ? "Este email ya está registrado. Intenta iniciar sesión." :
                            language === 'nl' ? "Dit e-mailadres is al geregistreerd. Probeer in te loggen." :
                            "This email is already registered. Try signing in." });
        } else {
          toast({
            title: language === 'pt' ? "Erro ao criar conta" : 
                   language === 'es' ? "Error al crear cuenta" :
                   language === 'nl' ? "Fout bij het aanmaken van account" :
                   "Error creating account",
            description: signUpError.message,
            variant: "destructive",
          });
        }
      } else {
        const signedInSession = signUpData?.session;

        if (!signedInSession) {
          const { error: signInError } = await Promise.race([
            supabase.auth.signInWithPassword({ email, password }),
            createTimeout(),
          ]) as { data: any; error: any };

          if (signInError) {
            toast({
              title: language === 'pt' ? "Conta criada" :
                     language === 'es' ? "Cuenta creada" :
                     language === 'nl' ? "Account aangemaakt" :
                     "Account created",
              description: language === 'pt' ? "Sua conta foi criada. Verifique seu e-mail para confirmar o acesso." :
                           language === 'es' ? "Tu cuenta fue creada. Revisa tu correo para confirmar el acceso." :
                           language === 'nl' ? "Je account is aangemaakt. Controleer je e-mail om toegang te bevestigen." :
                           "Your account was created. Check your email to confirm access.",
            });
            navigate("/");
            return;
          }
        }

        toast({
          title: "🙏 Seja bem-vindo à Aliança!",
          description: '"Porque para Deus nada é impossível." Lucas 1:37',
          duration: 5000,
          className: "bg-white/90 border border-white/20 shadow-glow text-foreground backdrop-blur-xl",
        });
        navigate("/");
      }
    } catch (err: any) {
      const isTimeout = err?.message === 'TIMEOUT';
      toast({
        title: language === 'pt' ? "Erro de conexão" : 
               language === 'es' ? "Error de conexión" :
               language === 'nl' ? "Verbindingsfout" :
               "Connection error",
        description: isTimeout 
          ? (language === 'pt' ? "A conexão está lenta. Tente novamente." :
             language === 'es' ? "La conexión es lenta. Intenta de nuevo." :
             language === 'nl' ? "Verbinding is traag. Probeer opnieuw." :
             "Connection is slow. Please try again.")
          : (language === 'pt' ? "Verifique sua internet e tente novamente." :
             language === 'es' ? "Verifica tu internet e intenta de nuevo." :
             language === 'nl' ? "Controleer je internet en probeer opnieuw." :
             "Check your internet and try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check offline status first
    if (!isOnline) {
      const errorMsg = getErrorMessage(false, false, 0);
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("signin-email") as string).trim();
    const password = formData.get("signin-password") as string;

    // Validate fields
    const validationErrors: Record<string, string> = {};

    const emailValidation = validateField(emailSchema, email);
    if (!emailValidation.valid) {
      validationErrors.signinEmail = emailValidation.error!;
    }

    const passwordValidation = validateField(loginPasswordSchema, password);
    if (!passwordValidation.valid) {
      validationErrors.signinPassword = passwordValidation.error!;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      // Use retry with exponential backoff
      const { error, attempts, isTimeout, isNetworkError } = await authWithRetry(
        () => supabase.auth.signInWithPassword({ email, password }),
        3, // max retries
        1000, // base delay 1s
        15000 // timeout 15s
      );

      if (error) {
        if (isTimeout || isNetworkError) {
          const errorMsg = getErrorMessage(isTimeout, isNetworkError, attempts);
          toast({
            title: errorMsg.title,
            description: errorMsg.description,
            variant: "destructive",
          });
        } else if (error.message?.includes("Invalid login credentials")) {
          setErrors({ signinEmail: language === 'pt' ? "Email ou senha incorretos" :
                                   language === 'es' ? "Correo o contraseña incorrectos" :
                                   language === 'nl' ? "Onjuist e-mailadres of wachtwoord" :
                                   "Incorrect email or password" });
        } else if (error.message?.includes("rate limit") || error.status === 429) {
          toast({
            title: language === 'pt' ? "Muitas tentativas" : 
                   language === 'es' ? "Demasiados intentos" :
                   language === 'nl' ? "Te veel pogingen" :
                   "Too many attempts",
            description: language === 'pt' ? "Aguarde alguns minutos antes de tentar novamente." :
                         language === 'es' ? "Espera unos minutos antes de intentar de nuevo." :
                         language === 'nl' ? "Wacht enkele minuten voordat je het opnieuw probeert." :
                         "Wait a few minutes before trying again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: language === 'pt' ? "Erro ao entrar" : 
                   language === 'es' ? "Error al iniciar sesión" :
                   language === 'nl' ? "Fout bij inloggen" :
                   "Error signing in",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "🙏 Seja bem-vindo à Aliança!",
          description: '"Porque para Deus nada é impossível." Lucas 1:37',
          duration: 5000,
          className: "bg-white/90 border border-white/20 shadow-glow text-foreground backdrop-blur-xl",
        });
        navigate("/");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMsg = getErrorMessage(false, true, 1);
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast({
          title: language === 'pt' ? "Erro ao conectar com Google" :
                 language === 'es' ? "Error al conectar con Google" :
                 language === 'nl' ? "Fout bij verbinden met Google" :
                 "Error connecting with Google",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: language === 'pt' ? "Erro de conexão" :
               language === 'es' ? "Error de conexión" :
               language === 'nl' ? "Verbindingsfout" :
               "Connection error",
        description: language === 'pt' ? "Verifique sua internet e tente novamente." :
                     language === 'es' ? "Verifica tu internet e intenta de nuevo." :
                     language === 'nl' ? "Controleer je internet en probeer opnieuw." :
                     "Check your internet and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const emailValidation = validateField(emailSchema, resetEmail);
    if (!emailValidation.valid) {
      setErrors({ resetEmail: emailValidation.error! });
      setLoading(false);
      return;
    }

    try {
      // Timeout de 15 segundos para conexões lentas
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 15000)
      );

      const resetPromise = supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      const { error } = await Promise.race([resetPromise, timeoutPromise]) as { error: any };

      if (error) {
        toast({
          title: language === 'pt' ? "Erro ao enviar e-mail" :
                 language === 'es' ? "Error al enviar correo" :
                 language === 'nl' ? "Fout bij verzenden e-mail" :
                 "Error sending email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: language === 'pt' ? "E-mail enviado!" :
                 language === 'es' ? "¡Correo enviado!" :
                 language === 'nl' ? "E-mail verzonden!" :
                 "Email sent!",
          description: language === 'pt' ? "Verifique sua caixa de entrada para redefinir sua senha." :
                       language === 'es' ? "Revisa tu bandeja de entrada para restablecer tu contraseña." :
                       language === 'nl' ? "Controleer je inbox om je wachtwoord te resetten." :
                       "Check your inbox to reset your password.",
        });
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch (err: any) {
      const isTimeout = err?.message === 'TIMEOUT';
      toast({
        title: language === 'pt' ? "Erro de conexão" : 
               language === 'es' ? "Error de conexión" :
               language === 'nl' ? "Verbindingsfout" :
               "Connection error",
        description: isTimeout 
          ? (language === 'pt' ? "A conexão está lenta. Tente novamente." :
             language === 'es' ? "La conexión es lenta. Intenta de nuevo." :
             language === 'nl' ? "Verbinding is traag. Probeer opnieuw." :
             "Connection is slow. Please try again.")
          : (language === 'pt' ? "Verifique sua internet e tente novamente." :
             language === 'es' ? "Verifica tu internet e intenta de nuevo." :
             language === 'nl' ? "Controleer je internet en probeer opnieuw." :
             "Check your internet and try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-1 text-sm text-destructive mt-1">
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    );
  };

  // Language selector for guest users - compact and lightweight
  const LanguageSelector = () => (
    <div className="flex items-center justify-center gap-1.5 mb-3">
      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
        <SelectTrigger className="w-28 h-7 text-xs border-muted">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pt">Português</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="nl">Nederlands</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // Network status indicator
  const NetworkIndicator = () => {
    if (isOnline) return null;
    
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm">
        <WifiOff className="h-4 w-4 text-destructive" />
        <span className="text-destructive font-medium">
          {language === 'pt' ? 'Você está offline' : 
           language === 'es' ? 'Estás sin conexión' :
           language === 'nl' ? 'Je bent offline' :
           "You're offline"}
        </span>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-amber-950 dark:via-yellow-950/60 dark:to-orange-950/60 p-3 sm:p-4">
      {/* Elementos decorativos dourados */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-gradient-to-br from-amber-400/20 to-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-tr from-orange-400/20 to-amber-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-yellow-300/20 to-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="relative w-full max-w-md shadow-2xl shadow-amber-900/10 mx-auto border-2 border-amber-200/60 dark:border-amber-800/40 bg-white/90 dark:bg-black/40 backdrop-blur-xl">
        <CardHeader className="text-center pb-4">
          <LanguageSelector />
          <NetworkIndicator />
          <div className="mx-auto w-24 h-24 mb-3 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/40 to-orange-500/30 blur-xl animate-pulse" />
            <img
              src="/alianca-logo.png"
              alt="Aliança"
              className="relative w-24 h-24 object-contain drop-shadow-[0_0_18px_rgba(217,119,6,0.45)]"
            />
          </div>
          <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent tracking-wide">
            {language === 'pt' ? 'Aliança' :
             language === 'es' ? 'Red de Fe' :
             language === 'nl' ? 'Geloofsnetwerk' :
             'Faith Network'}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('auth.welcome')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-amber-100/60 dark:bg-amber-950/40">
              <TabsTrigger
                value="signin"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                {t('auth.signIn')}
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                {t('auth.signUp')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              {showForgotPassword ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t('auth.email')}</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder={language === 'pt' ? "seu@email.com" : 
                                   language === 'es' ? "tu@email.com" :
                                   "your@email.com"}
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        clearError("resetEmail");
                      }}
                      className={errors.resetEmail ? "border-destructive" : ""}
                      required
                    />
                    <ErrorMessage error={errors.resetEmail} />
                  </div>
                  <Button
                    type="submit"
                    className="w-full !bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 !text-white shadow-md"
                    disabled={loading}
                  >
                    {loading ? t('common.loading') : t('auth.sendRecoveryLink')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    {t('auth.backToLogin')}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t('auth.email')}</Label>
                    <Input
                      id="signin-email"
                      name="signin-email"
                      type="email"
                      placeholder={language === 'pt' ? "seu@email.com" : 
                                   language === 'es' ? "tu@email.com" :
                                   "your@email.com"}
                      onChange={() => clearError("signinEmail")}
                      className={errors.signinEmail ? "border-destructive" : ""}
                      required
                    />
                    <ErrorMessage error={errors.signinEmail} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t('auth.password')}</Label>
                    <Input
                      id="signin-password"
                      name="signin-password"
                      type="password"
                      placeholder="••••••••"
                      onChange={() => clearError("signinPassword")}
                      className={errors.signinPassword ? "border-destructive" : ""}
                      required
                    />
                    <ErrorMessage error={errors.signinPassword} />
                  </div>
                  <Button
                    type="submit"
                    className="w-full !bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 !text-white shadow-md"
                    disabled={loading}
                  >
                    {loading ? t('common.loading') : t('auth.signIn')}
                  </Button>

                  {/* Divisor */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {language === 'pt' ? 'Ou continue com' :
                         language === 'es' ? 'O continúa con' :
                         language === 'nl' ? 'Of ga verder met' :
                         'Or continue with'}
                      </span>
                    </div>
                  </div>

                  {/* Botão Google */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <FcGoogle className="mr-2 h-5 w-5" />
                    {language === 'pt' ? 'Entrar com Google' :
                     language === 'es' ? 'Iniciar con Google' :
                     language === 'nl' ? 'Inloggen met Google' :
                     'Sign in with Google'}
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm text-muted-foreground hover:text-primary"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    {t('auth.forgotPassword')}
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Country Selection */}
                <div className="space-y-2">
                  <Label htmlFor="country">{t('auth.country')} *</Label>
                  <Select value={selectedCountry} onValueChange={(val) => {
                    setSelectedCountry(val);
                    clearError("country");
                  }}>
                    <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                      <SelectValue placeholder={t('auth.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent>
                      {SOUTH_AMERICAN_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ErrorMessage error={errors.country} />
                </div>

                {/* Birth Date */}
                <div className="space-y-2">
                  <Label htmlFor="birth-date">{t('auth.birthDate')} *</Label>
                  <Input
                    id="birth-date"
                    name="birth-date"
                    type="date"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      clearError("birthDate");
                    }}
                    className={errors.birthDate ? "border-destructive" : ""}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <ErrorMessage error={errors.birthDate} />
                  {selectedCountry && (
                    <p className="text-xs text-muted-foreground">
                      {t('auth.minAge', { age: getMinAgeByCountry(selectedCountry) })}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-name">{t('auth.fullName')}</Label>
                  <Input
                    id="full-name"
                    name="full-name"
                    type="text"
                    placeholder={language === 'pt' ? "João Silva" : 
                                 language === 'es' ? "Juan García" :
                                 language === 'nl' ? "Jan de Vries" :
                                 "John Smith"}
                    onChange={() => clearError("fullName")}
                    className={errors.fullName ? "border-destructive" : ""}
                    required
                  />
                  <ErrorMessage error={errors.fullName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">{t('auth.username')}</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder={language === 'pt' ? "joaosilva" : 
                                 language === 'es' ? "juangarcia" :
                                 "johnsmith"}
                    onChange={() => clearError("username")}
                    className={errors.username ? "border-destructive" : ""}
                    required
                  />
                  <ErrorMessage error={errors.username} />
                  <p className="text-xs text-muted-foreground">
                    {t('auth.usernameHint')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    placeholder={language === 'pt' ? "seu@email.com" : 
                                 language === 'es' ? "tu@email.com" :
                                 "your@email.com"}
                    onChange={() => clearError("email")}
                    className={errors.email ? "border-destructive" : ""}
                    required
                  />
                  <ErrorMessage error={errors.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <Input
                    id="signup-password"
                    name="signup-password"
                    type="password"
                    placeholder="••••••••"
                    onChange={() => clearError("password")}
                    className={errors.password ? "border-destructive" : ""}
                    required
                  />
                  <ErrorMessage error={errors.password} />
                  <p className="text-xs text-muted-foreground">
                    {t('auth.passwordHint')}
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full !bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 !text-white shadow-md"
                  disabled={loading}
                >
                  {loading ? t('common.loading') : t('auth.createAccount')}
                </Button>

                {/* Divisor */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {language === 'pt' ? 'Ou cadastre-se com' :
                       language === 'es' ? 'O regístrate con' :
                       language === 'nl' ? 'Of registreer met' :
                       'Or sign up with'}
                    </span>
                  </div>
                </div>

                {/* Botão Google */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <FcGoogle className="mr-2 h-5 w-5" />
                  {language === 'pt' ? 'Cadastrar com Google' :
                   language === 'es' ? 'Registrarse con Google' :
                   language === 'nl' ? 'Registreren met Google' :
                   'Sign up with Google'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de seleção de país para login com Google */}
      <CountrySelectionModal
        open={showCountryModal}
        onComplete={() => {
          setShowCountryModal(false);
          navigate('/');
        }}
      />
    </div>
  );
};

export default Auth;
