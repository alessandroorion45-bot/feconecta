import { z } from "zod";

// =============================================
// VALIDAÇÃO E SANITIZAÇÃO CENTRALIZADAS
// =============================================

// Função de sanitização contra XSS
export const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/`/g, "&#x60;")
    .trim();
};

// Função para remover tags HTML
export const stripHtml = (text: string): string => {
  return text.replace(/<[^>]*>/g, "").trim();
};

// Validação de email
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email é obrigatório")
  .email("Email inválido")
  .max(255, "Email muito longo");

// Validação de senha segura
export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .max(72, "Senha muito longa")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Senha deve conter letra maiúscula, minúscula e número"
  );

// Validação de senha simples (para login)
export const loginPasswordSchema = z
  .string()
  .min(1, "Senha é obrigatória")
  .max(72, "Senha muito longa");

// Validação de username
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Mínimo de 3 caracteres")
  .max(20, "Máximo de 20 caracteres")
  .regex(/^[a-zA-Z0-9_]+$/, "Use apenas letras, números e underline (_)")
  .transform((val) => val.toLowerCase());

// Validação de nome completo
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Nome muito curto")
  .max(100, "Nome muito longo")
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos");

// Validação de bio/descrição
export const bioSchema = z
  .string()
  .max(500, "Bio muito longa")
  .transform((val) => sanitizeText(val))
  .optional()
  .or(z.literal(""));

// Validação de comentário
export const commentSchema = z
  .string()
  .trim()
  .min(1, "Comentário não pode estar vazio")
  .max(300, "Comentário deve ter no máximo 300 caracteres")
  .transform((val) => sanitizeText(val));

// Validação de título
export const titleSchema = z
  .string()
  .trim()
  .min(3, "Título muito curto")
  .max(100, "Título muito longo")
  .transform((val) => sanitizeText(val));

// Validação de conteúdo longo (testemunhos, orações, etc.)
export const contentSchema = z
  .string()
  .trim()
  .min(10, "Conteúdo muito curto")
  .max(5000, "Conteúdo muito longo")
  .transform((val) => sanitizeText(val));

// Validação de depoimento de amigo
export const friendTestimonialSchema = z
  .string()
  .trim()
  .min(10, "Depoimento muito curto")
  .max(300, "Depoimento deve ter no máximo 300 caracteres")
  .transform((val) => sanitizeText(val));

// Validação de nota bíblica
export const bibleNoteSchema = z
  .string()
  .trim()
  .min(1, "Anotação não pode estar vazia")
  .max(2000, "Anotação muito longa")
  .transform((val) => sanitizeText(val));

// Validação de URL (para mídia)
export const urlSchema = z
  .string()
  .url("URL inválida")
  .max(2048, "URL muito longa")
  .optional()
  .or(z.literal(""));

// Validação de cidade
export const citySchema = z
  .string()
  .max(100, "Nome da cidade muito longo")
  .transform((val) => sanitizeText(val))
  .optional()
  .or(z.literal(""));

// Validação de nome da igreja
export const churchNameSchema = z
  .string()
  .max(150, "Nome da igreja muito longo")
  .transform((val) => sanitizeText(val))
  .optional()
  .or(z.literal(""));

// =============================================
// SCHEMAS COMPOSTOS
// =============================================

// Schema de login
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

// Schema de cadastro
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  fullName: fullNameSchema,
});

// Schema de perfil
export const profileSchema = z.object({
  username: usernameSchema,
  fullName: fullNameSchema,
  bio: bioSchema,
  city: citySchema,
  churchName: churchNameSchema,
  maritalStatus: z.enum(["solteiro", "casado", "viuvo", "divorciado", ""]).optional(),
});

// Schema de oração
export const prayerSchema = z.object({
  title: titleSchema,
  description: contentSchema,
  category: z.string().min(1, "Categoria é obrigatória"),
});

// Schema de testemunho
export const testimonySchema = z.object({
  title: titleSchema,
  content: contentSchema,
});

// Schema de evento
export const eventSchema = z.object({
  title: titleSchema,
  description: contentSchema,
  location: z.string().min(1, "Local é obrigatório").max(200, "Local muito longo"),
  city: z.string().min(1, "Cidade é obrigatória").max(100, "Cidade muito longa"),
  eventDate: z.string().min(1, "Data é obrigatória"),
});

// =============================================
// FUNÇÕES DE VALIDAÇÃO HELPER
// =============================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  
  return { success: false, errors };
}

// Validar campo único
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { valid: boolean; error?: string; data?: T } {
  const result = schema.safeParse(value);
  
  if (result.success) {
    return { valid: true, data: result.data };
  }
  
  return { valid: false, error: result.error.errors[0]?.message };
}

// =============================================
// VALIDAÇÃO DE UPLOAD DE ARQUIVOS
// =============================================

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP." };
  }
  
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "Imagem muito grande. Máximo 5MB." };
  }
  
  return { valid: true };
}

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return { valid: false, error: "Tipo de arquivo não permitido. Use MP3, WAV ou OGG." };
  }
  
  if (file.size > MAX_AUDIO_SIZE) {
    return { valid: false, error: "Áudio muito grande. Máximo 20MB." };
  }
  
  return { valid: true };
}
