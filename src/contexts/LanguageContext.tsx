import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Language = 'pt' | 'es' | 'en' | 'nl';

export interface Country {
  code: string;
  name: string;
  language: Language;
  minAge: number;
}

// Canonical country to language mapping (ISO 3166-1 alpha-2 -> ISO 639-1)
const COUNTRY_LANGUAGE_MAP: Record<string, Language> = {
  // Portuguese
  'BR': 'pt',
  'PT': 'pt',
  // Spanish
  'VE': 'es',
  'AR': 'es',
  'CL': 'es',
  'CO': 'es',
  'PE': 'es',
  'BO': 'es',
  'PY': 'es',
  'UY': 'es',
  'EC': 'es',
  'MX': 'es',
  // English
  'US': 'en',
  'UK': 'en',
  'GB': 'en',
  'CA': 'en',
  'AU': 'en',
  'GY': 'en',
  // Dutch
  'NL': 'nl',
  'BE': 'nl',
  'SR': 'nl',
};

export const SOUTH_AMERICAN_COUNTRIES: Country[] = [
  { code: 'BR', name: 'Brasil', language: 'pt', minAge: 13 },
  { code: 'AR', name: 'Argentina', language: 'es', minAge: 13 },
  { code: 'CL', name: 'Chile', language: 'es', minAge: 14 },
  { code: 'CO', name: 'Colômbia', language: 'es', minAge: 14 },
  { code: 'PE', name: 'Peru', language: 'es', minAge: 14 },
  { code: 'BO', name: 'Bolívia', language: 'es', minAge: 13 },
  { code: 'PY', name: 'Paraguai', language: 'es', minAge: 13 },
  { code: 'UY', name: 'Uruguai', language: 'es', minAge: 13 },
  { code: 'EC', name: 'Equador', language: 'es', minAge: 13 },
  { code: 'VE', name: 'Venezuela', language: 'es', minAge: 13 },
  { code: 'GY', name: 'Guiana', language: 'en', minAge: 13 },
  { code: 'SR', name: 'Suriname', language: 'nl', minAge: 16 },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return SOUTH_AMERICAN_COUNTRIES.find(c => c.code === code);
};

/**
 * Get language from country code using the canonical mapping.
 * This is the PRIMARY source of truth for registered users.
 */
export const getLanguageByCountry = (countryCode: string): Language => {
  const normalized = countryCode?.toUpperCase();
  return COUNTRY_LANGUAGE_MAP[normalized] || 'pt'; // Default fallback
};

export const getMinAgeByCountry = (countryCode: string): number => {
  const country = getCountryByCode(countryCode);
  return country?.minAge || 13;
};

const isValidLanguage = (lang: string | null | undefined): lang is Language => {
  return !!lang && ['pt', 'es', 'en', 'nl'].includes(lang);
};

/**
 * Resolve the language for a user based on priority:
 * 1. If user explicitly set their language manually, respect it
 * 2. Language derived from country mapping (PRIMARY for registered users)
 * 3. Browser language (as suggestion for guests)
 * 4. Global fallback (pt)
 */
export const resolveLanguage = (
  countryCode: string | null | undefined,
  userPreference: string | null | undefined,
  isManualPreference: boolean = false,
  browserLang?: string
): Language => {
  // 1. If user explicitly set their language manually, respect it
  if (isManualPreference && isValidLanguage(userPreference)) {
    console.log('[Language] Using manual preference:', userPreference);
    return userPreference;
  }

  // 2. ALWAYS derive from country mapping for registered users
  if (countryCode) {
    const mappedLang = getLanguageByCountry(countryCode);
    console.log('[Language] Using country mapping:', countryCode, '->', mappedLang);
    return mappedLang;
  }

  // 3. Browser language as fallback for guests
  if (browserLang) {
    const normalizedBrowserLang = browserLang.split('-')[0].toLowerCase();
    if (isValidLanguage(normalizedBrowserLang)) {
      console.log('[Language] Using browser language:', normalizedBrowserLang);
      return normalizedBrowserLang;
    }
  }

  // 4. Global fallback
  console.log('[Language] Using global fallback: pt');
  return 'pt';
};

type TranslationKey = 
  | 'auth.welcome'
  | 'auth.signIn'
  | 'auth.signUp'
  | 'auth.email'
  | 'auth.password'
  | 'auth.fullName'
  | 'auth.username'
  | 'auth.country'
  | 'auth.birthDate'
  | 'auth.createAccount'
  | 'auth.forgotPassword'
  | 'auth.sendRecoveryLink'
  | 'auth.backToLogin'
  | 'auth.accountCreated'
  | 'auth.welcomeBack'
  | 'auth.selectCountry'
  | 'auth.ageError'
  | 'auth.minAge'
  | 'auth.usernameHint'
  | 'auth.passwordHint'
  | 'nav.home'
  | 'nav.bible'
  | 'nav.prayers'
  | 'nav.testimonies'
  | 'nav.friends'
  | 'nav.profile'
  | 'nav.chat'
  | 'nav.community'
  | 'nav.achievements'
  | 'nav.ranking'
  | 'nav.videos'
  | 'nav.quiz'
  | 'nav.challenges'
  | 'common.loading'
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.search'
  | 'common.seeMore'
  | 'common.seeLess'
  | 'common.language'
  | 'common.settings'
  | 'friends.suggestions'
  | 'friends.fromYourCountry'
  | 'friends.fromOtherCountries'
  | 'friends.friendLimit'
  | 'settings.language'
  | 'settings.changeLanguage'
  | 'settings.languageUpdated';

const translations: Record<Language, Record<TranslationKey, string>> = {
  pt: {
    'auth.welcome': 'Conecte-se com irmãos em Cristo',
    'auth.signIn': 'Entrar',
    'auth.signUp': 'Criar Conta',
    'auth.email': 'Email',
    'auth.password': 'Senha',
    'auth.fullName': 'Nome Completo',
    'auth.username': 'Nome de Usuário',
    'auth.country': 'País',
    'auth.birthDate': 'Data de Nascimento',
    'auth.createAccount': 'Criar Conta',
    'auth.forgotPassword': 'Esqueceu a senha?',
    'auth.sendRecoveryLink': 'Enviar link de recuperação',
    'auth.backToLogin': 'Voltar ao login',
    'auth.accountCreated': 'Conta criada!',
    'auth.welcomeBack': 'Bem-vindo de volta!',
    'auth.selectCountry': 'Selecione seu país',
    'auth.ageError': 'Você não atende à idade mínima para cadastro',
    'auth.minAge': 'Idade mínima: {age} anos',
    'auth.usernameHint': 'Use apenas letras, números e underline (_). Mínimo 3 caracteres.',
    'auth.passwordHint': 'Mínimo 8 caracteres com letra maiúscula, minúscula e número.',
    'nav.home': 'Início',
    'nav.bible': 'Bíblia',
    'nav.prayers': 'Orações',
    'nav.testimonies': 'Testemunhos',
    'nav.friends': 'Amigos',
    'nav.profile': 'Perfil',
    'nav.chat': 'Mensagens',
    'nav.community': 'Comunidade',
    'nav.achievements': 'Conquistas',
    'nav.ranking': 'Ranking',
    'nav.videos': 'Vídeos',
    'nav.quiz': 'Quiz',
    'nav.challenges': 'Desafios',
    'common.loading': 'Carregando...',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.search': 'Buscar',
    'common.seeMore': 'Ver mais',
    'common.seeLess': 'Ver menos',
    'common.language': 'Idioma',
    'common.settings': 'Configurações',
    'friends.suggestions': 'Sugestões de amizade',
    'friends.fromYourCountry': 'Do seu país',
    'friends.fromOtherCountries': 'De outros países',
    'friends.friendLimit': 'Você atingiu o limite de 10.000 amigos',
    'settings.language': 'Idioma',
    'settings.changeLanguage': 'Alterar idioma',
    'settings.languageUpdated': 'Idioma atualizado com sucesso',
  },
  es: {
    'auth.welcome': 'Conéctate con hermanos en Cristo',
    'auth.signIn': 'Iniciar Sesión',
    'auth.signUp': 'Crear Cuenta',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.fullName': 'Nombre Completo',
    'auth.username': 'Nombre de Usuario',
    'auth.country': 'País',
    'auth.birthDate': 'Fecha de Nacimiento',
    'auth.createAccount': 'Crear Cuenta',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.sendRecoveryLink': 'Enviar enlace de recuperación',
    'auth.backToLogin': 'Volver al inicio de sesión',
    'auth.accountCreated': '¡Cuenta creada!',
    'auth.welcomeBack': '¡Bienvenido de vuelta!',
    'auth.selectCountry': 'Selecciona tu país',
    'auth.ageError': 'No cumples con la edad mínima para registrarte',
    'auth.minAge': 'Edad mínima: {age} años',
    'auth.usernameHint': 'Usa solo letras, números y guion bajo (_). Mínimo 3 caracteres.',
    'auth.passwordHint': 'Mínimo 8 caracteres con mayúscula, minúscula y número.',
    'nav.home': 'Inicio',
    'nav.bible': 'Biblia',
    'nav.prayers': 'Oraciones',
    'nav.testimonies': 'Testimonios',
    'nav.friends': 'Amigos',
    'nav.profile': 'Perfil',
    'nav.chat': 'Mensajes',
    'nav.community': 'Comunidad',
    'nav.achievements': 'Logros',
    'nav.ranking': 'Ranking',
    'nav.videos': 'Videos',
    'nav.quiz': 'Quiz',
    'nav.challenges': 'Desafíos',
    'common.loading': 'Cargando...',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.search': 'Buscar',
    'common.seeMore': 'Ver más',
    'common.seeLess': 'Ver menos',
    'common.language': 'Idioma',
    'common.settings': 'Configuración',
    'friends.suggestions': 'Sugerencias de amistad',
    'friends.fromYourCountry': 'De tu país',
    'friends.fromOtherCountries': 'De otros países',
    'friends.friendLimit': 'Has alcanzado el límite de 10.000 amigos',
    'settings.language': 'Idioma',
    'settings.changeLanguage': 'Cambiar idioma',
    'settings.languageUpdated': 'Idioma actualizado correctamente',
  },
  en: {
    'auth.welcome': 'Connect with brothers and sisters in Christ',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.username': 'Username',
    'auth.country': 'Country',
    'auth.birthDate': 'Date of Birth',
    'auth.createAccount': 'Create Account',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.sendRecoveryLink': 'Send recovery link',
    'auth.backToLogin': 'Back to login',
    'auth.accountCreated': 'Account created!',
    'auth.welcomeBack': 'Welcome back!',
    'auth.selectCountry': 'Select your country',
    'auth.ageError': 'You do not meet the minimum age requirement',
    'auth.minAge': 'Minimum age: {age} years',
    'auth.usernameHint': 'Use only letters, numbers, and underscore (_). Minimum 3 characters.',
    'auth.passwordHint': 'Minimum 8 characters with uppercase, lowercase, and number.',
    'nav.home': 'Home',
    'nav.bible': 'Bible',
    'nav.prayers': 'Prayers',
    'nav.testimonies': 'Testimonies',
    'nav.friends': 'Friends',
    'nav.profile': 'Profile',
    'nav.chat': 'Messages',
    'nav.community': 'Community',
    'nav.achievements': 'Achievements',
    'nav.ranking': 'Ranking',
    'nav.videos': 'Videos',
    'nav.quiz': 'Quiz',
    'nav.challenges': 'Challenges',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'common.seeMore': 'See more',
    'common.seeLess': 'See less',
    'common.language': 'Language',
    'common.settings': 'Settings',
    'friends.suggestions': 'Friend suggestions',
    'friends.fromYourCountry': 'From your country',
    'friends.fromOtherCountries': 'From other countries',
    'friends.friendLimit': 'You have reached the 10,000 friend limit',
    'settings.language': 'Language',
    'settings.changeLanguage': 'Change language',
    'settings.languageUpdated': 'Language updated successfully',
  },
  nl: {
    'auth.welcome': 'Verbind met broeders en zusters in Christus',
    'auth.signIn': 'Inloggen',
    'auth.signUp': 'Account aanmaken',
    'auth.email': 'E-mail',
    'auth.password': 'Wachtwoord',
    'auth.fullName': 'Volledige naam',
    'auth.username': 'Gebruikersnaam',
    'auth.country': 'Land',
    'auth.birthDate': 'Geboortedatum',
    'auth.createAccount': 'Account aanmaken',
    'auth.forgotPassword': 'Wachtwoord vergeten?',
    'auth.sendRecoveryLink': 'Herstelkoppeling verzenden',
    'auth.backToLogin': 'Terug naar inloggen',
    'auth.accountCreated': 'Account aangemaakt!',
    'auth.welcomeBack': 'Welkom terug!',
    'auth.selectCountry': 'Selecteer je land',
    'auth.ageError': 'Je voldoet niet aan de minimumleeftijd',
    'auth.minAge': 'Minimumleeftijd: {age} jaar',
    'auth.usernameHint': 'Gebruik alleen letters, cijfers en underscore (_). Minimaal 3 tekens.',
    'auth.passwordHint': 'Minimaal 8 tekens met hoofdletter, kleine letter en cijfer.',
    'nav.home': 'Home',
    'nav.bible': 'Bijbel',
    'nav.prayers': 'Gebeden',
    'nav.testimonies': 'Getuigenissen',
    'nav.friends': 'Vrienden',
    'nav.profile': 'Profiel',
    'nav.chat': 'Berichten',
    'nav.community': 'Gemeenschap',
    'nav.achievements': 'Prestaties',
    'nav.ranking': 'Ranglijst',
    'nav.videos': "Video's",
    'nav.quiz': 'Quiz',
    'nav.challenges': 'Uitdagingen',
    'common.loading': 'Laden...',
    'common.save': 'Opslaan',
    'common.cancel': 'Annuleren',
    'common.delete': 'Verwijderen',
    'common.edit': 'Bewerken',
    'common.search': 'Zoeken',
    'common.seeMore': 'Meer bekijken',
    'common.seeLess': 'Minder bekijken',
    'common.language': 'Taal',
    'common.settings': 'Instellingen',
    'friends.suggestions': 'Vriendschapsuggesties',
    'friends.fromYourCountry': 'Uit je land',
    'friends.fromOtherCountries': 'Uit andere landen',
    'friends.friendLimit': 'Je hebt de limiet van 10.000 vrienden bereikt',
    'settings.language': 'Taal',
    'settings.changeLanguage': 'Taal wijzigen',
    'settings.languageUpdated': 'Taal succesvol bijgewerkt',
  },
};

// Translation cache for performance
const translationCache = new Map<string, string>();

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language, isManual?: boolean) => void;
  userCountry: string | null;
  setUserCountry: (country: string) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isManualPreference: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('pt');
  const [userCountry, setUserCountryState] = useState<string | null>(null);
  const [isManualPreference, setIsManualPreference] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Apply language to logged-in user and persist to DB if needed
  const applyUserLanguage = useCallback(async (
    userId: string, 
    country: string | null, 
    preferredLang: string | null,
    setManually: boolean = false
  ) => {
    const resolvedLang = resolveLanguage(country, preferredLang, setManually);
    setLanguageState(resolvedLang);
    setIsManualPreference(setManually);
    
    if (country) {
      setUserCountryState(country);
    }

    // Persist to database if preferred_language doesn't match what should be set
    const expectedLang = setManually && isValidLanguage(preferredLang) 
      ? preferredLang 
      : (country ? getLanguageByCountry(country) : resolvedLang);
    
    if (preferredLang !== expectedLang) {
      console.log(`[Language] Updating user ${userId}: ${preferredLang} -> ${expectedLang} (country: ${country}, manual: ${setManually})`);
      await supabase
        .from('profiles')
        .update({ 
          preferred_language: expectedLang,
          set_language_manually: setManually 
        })
        .eq('id', userId);
    }
  }, []);

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('country, preferred_language, set_language_manually')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            await applyUserLanguage(
              user.id, 
              profile.country, 
              profile.preferred_language,
              profile.set_language_manually ?? false
            );
          }
        } else {
          // Guest user: check localStorage, then browser language
          const storedLang = localStorage.getItem('preferred_language');
          const browserLang = navigator.language || (navigator as any).userLanguage;
          const resolvedLang = resolveLanguage(null, storedLang, false, browserLang);
          setLanguageState(resolvedLang);
        }
      } catch (error) {
        console.error('Error loading language preferences:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadUserPreferences();

    // Listen for auth state changes to reload preferences
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userId = session.user.id;
        // NUNCA usar await com chamadas Supabase dentro deste callback:
        // ele roda segurando o lock interno de auth e qualquer query aqui
        // trava (deadlock) todas as requisições seguintes do app.
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('country, preferred_language, set_language_manually')
            .eq('id', userId)
            .single();

          if (profile) {
            await applyUserLanguage(
              userId,
              profile.country,
              profile.preferred_language,
              profile.set_language_manually ?? false
            );
          }
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [applyUserLanguage]);

  const setLanguage = useCallback(async (lang: Language, isManual: boolean = true) => {
    setLanguageState(lang);
    setIsManualPreference(isManual);
    localStorage.setItem('preferred_language', lang);
    
    // Clear translation cache when language changes
    translationCache.clear();
    
    // Persist to profile if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ 
          preferred_language: lang,
          set_language_manually: isManual 
        })
        .eq('id', user.id);
      console.log(`[Language] User ${user.id} changed language to ${lang} (manual: ${isManual})`);
    }
  }, []);

  const setUserCountry = useCallback((country: string) => {
    setUserCountryState(country);
    // Only auto-set language if not manually set
    if (!isManualPreference) {
      const lang = getLanguageByCountry(country);
      setLanguageState(lang);
      localStorage.setItem('preferred_language', lang);
    }
  }, [isManualPreference]);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    // Check cache first
    const cacheKey = `${language}:${key}:${params ? JSON.stringify(params) : ''}`;
    const cached = translationCache.get(cacheKey);
    if (cached) return cached;

    // Fallback chain: current language -> English -> Portuguese -> key
    let text = translations[language]?.[key] 
      || translations['en']?.[key] 
      || translations['pt']?.[key] 
      || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    
    // Cache the result
    translationCache.set(cacheKey, text);
    
    return text;
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    userCountry,
    setUserCountry,
    t,
    isManualPreference,
  }), [language, setLanguage, userCountry, setUserCountry, t, isManualPreference]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
