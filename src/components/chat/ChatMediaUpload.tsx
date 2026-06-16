import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Image, Mic, X, Loader2, Play, Pause, Square } from 'lucide-react';
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

    setIsUploading(true);

    try {
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      onMediaUpload(publicUrl, 'image');
      toast({
        title: 'Imagem enviada!',
        description: 'Sua imagem foi anexada à mensagem'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
    <div className="flex items-center gap-1">
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
