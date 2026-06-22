import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Square, Play, Pause, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_RECORDING_TIME = 180; // 3 minutes in seconds

const AudioRecorder = ({ userId, onClose, onSuccess }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setElapsedTime(0);

      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);

      toast({
        title: "Gravação iniciada",
        description: "Compartilhe seu testemunho em áudio",
      });
    } catch {
      toast({
        title: "Erro ao acessar microfone",
        description: "Permita o acesso ao microfone para gravar.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      toast({
        title: "Gravação finalizada",
        description: "Ouça seu áudio antes de publicar.",
      });
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

  const handleUpload = async () => {
    if (!audioBlob || !title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Adicione um título ao seu testemunho.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const timestamp = Date.now();
      const extension = audioBlob.type.includes("webm") ? "webm" : "mp4";
      const fileName = `${userId}/${timestamp}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("testimonies-audio")
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("testimonies-audio")
        .getPublicUrl(fileName);

      console.log('[AudioRecorder] Tentando inserir testemunho em áudio:', {
        user_id: userId,
        title: title.trim(),
        audio_url: publicUrlData.publicUrl
      });

      // Verificar se o perfil existe antes de inserir
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        console.error('[AudioRecorder] Perfil não encontrado:', profileError);
        throw new Error("Perfil não encontrado. Tente fazer logout e login novamente.");
      }

      console.log('[AudioRecorder] Perfil encontrado:', profileData);

      const { data: insertData, error: insertError } = await supabase.from("testimonies").insert({
        user_id: userId,
        title: title.trim(),
        content: "[Testemunho em áudio]",
        audio_url: publicUrlData.publicUrl,
      }).select();

      if (insertError) {
        console.error('[AudioRecorder] Erro ao inserir testemunho:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details
        });
        throw insertError;
      }

      console.log('[AudioRecorder] Testemunho inserido com sucesso:', insertData);

      toast({
        title: "Testemunho publicado!",
        description: "Seu áudio foi compartilhado com sucesso.",
      });

      onSuccess();
    } catch (err) {
      console.error("Upload error:", err);
      toast({
        title: "Erro ao publicar",
        description: "Não foi possível salvar o áudio. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setElapsedTime(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-4">
      {/* Timer display */}
      <div className="text-center">
        <span className="text-4xl font-mono font-bold text-primary">
          {formatTime(elapsedTime)}
        </span>
        <p className="text-xs text-muted-foreground mt-1">
          Máximo: {formatTime(MAX_RECORDING_TIME)}
        </p>
      </div>

      {/* Recording controls */}
      {!audioBlob ? (
        <div className="flex justify-center">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              size="lg"
              className="gap-2 bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16"
              aria-label="Iniciar gravação"
            >
              <Mic className="h-6 w-6" />
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              size="lg"
              className="gap-2 bg-gray-700 hover:bg-gray-800 text-white rounded-full h-16 w-16"
              aria-label="Parar gravação"
            >
              <Square className="h-6 w-6 fill-current" />
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Audio preview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <audio
              ref={audioRef}
              src={audioUrl || undefined}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={togglePlayback}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                aria-label={isPlaying ? "Pausar áudio" : "Ouvir testemunho"}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <Button
                onClick={resetRecording}
                variant="ghost"
                size="sm"
                className="text-destructive"
              >
                Gravar novamente
              </Button>
            </div>
          </div>

          {/* Title input */}
          <Input
            placeholder="Título do testemunho (ex: Cura, Libertação)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />

          {/* Publish button */}
          <Button
            onClick={handleUpload}
            disabled={isUploading || !title.trim()}
            className="w-full bg-gradient-primary gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Publicar Testemunho
              </>
            )}
          </Button>
        </>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 text-red-500">
          <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium">Gravando...</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
