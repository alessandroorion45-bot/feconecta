import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Image, Mic, X, Loader2, Play, Pause, Square, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface ChatMediaUploadProps {
  userId: string;
  onMediaUpload: (mediaUrl: string, mediaType: 'image' | 'audio') => void;
  disabled?: boolean;
}

export const ChatMediaUpload: React.FC<ChatMediaUploadProps> = ({
  userId,
  onMediaUpload,
  disabled = false
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Prévia da imagem antes de enviar (só sobe ao confirmar)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione apenas imagens',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB',
        variant: 'destructive'
      });
      return;
    }

    // Mostra a prévia; o envio (upload) só acontece ao confirmar.
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const sendImage = async () => {
    if (!imageFile) return;
    setIsUploading(true);
    try {
      // Nome seguro: o Supabase Storage rejeita chave com acento/espaço/
      // parênteses etc. Usamos só a extensão sanitizada + id aleatório.
      const ext = (imageFile.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      onMediaUpload(publicUrl, 'image');
      cancelImage();
      toast({ title: 'Imagem enviada!', description: 'Sua imagem foi anexada à mensagem' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Erro ao enviar', description: 'Tente novamente', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  // Limpa o object URL da prévia ao desmontar (evita vazamento)
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Erro ao gravar',
        description: 'Verifique as permissões do microfone',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    setIsUploading(true);

    try {
      const fileName = `${userId}/${Date.now()}-audio.webm`;
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      onMediaUpload(publicUrl, 'audio');
      cancelRecording();
      toast({
        title: 'Áudio enviado!',
        description: 'Seu áudio foi anexado à mensagem'
      });
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex items-center gap-1">
      {/* Prévia da imagem antes de enviar */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="absolute bottom-full left-0 mb-3 z-30 w-64 rounded-2xl border border-border/70 bg-popover shadow-2xl overflow-hidden"
          >
            <div className="relative bg-muted/60">
              <img src={imagePreview} alt="Prévia da imagem" className="w-full max-h-60 object-contain" />
              <button
                onClick={cancelImage}
                aria-label="Descartar imagem"
                className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 p-2.5">
              <span className="text-xs text-muted-foreground pl-1">Enviar esta imagem?</span>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={cancelImage} disabled={isUploading} className="h-8">
                  Cancelar
                </Button>
                <Button size="sm" onClick={sendImage} disabled={isUploading} className="h-8 px-3 gap-1.5">
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar</>}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading || isRecording}
        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Image className="h-5 w-5" />
        )}
      </Button>

      {/* Audio recording */}
      <AnimatePresence mode="wait">
        {audioUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50"
          >
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayback}
              className="h-7 w-7"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              {formatTime(recordingTime)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelRecording}
              className="h-7 w-7 text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={sendAudio}
              disabled={isUploading}
              className="h-7 px-3"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Enviar'
              )}
            </Button>
          </motion.div>
        ) : isRecording ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10"
          >
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-destructive"
            />
            <span className="text-sm text-destructive font-medium">
              {formatTime(recordingTime)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={stopRecording}
              className="h-7 w-7"
            >
              <Square className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={startRecording}
            disabled={disabled || isUploading}
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </AnimatePresence>
    </div>
  );
};
