import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrayerAudioRecorderProps {
  onAudioReady: (audioBlob: Blob) => void;
  onClear: () => void;
  existingAudioUrl?: string | null;
}

export const PrayerAudioRecorder = ({ 
  onAudioReady, 
  onClear,
  existingAudioUrl 
}: PrayerAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (error) {
      setHasPermission(false);
      return false;
    }
  };

  const startRecording = async () => {
    const permitted = hasPermission ?? await requestPermission();
    if (!permitted) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioReady(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
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

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const clearRecording = () => {
    if (audioUrl && !existingAudioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingTime(0);
    onClear();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
        <p>Permissão de microfone negada. Habilite nas configurações do navegador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {audioUrl ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            onEnded={handleAudioEnded}
            className="hidden"
          />
          
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={togglePlayback}
            className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-primary" />
            ) : (
              <Play className="h-5 w-5 text-primary ml-0.5" />
            )}
          </Button>

          <div className="flex-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full bg-primary transition-all",
                  isPlaying && "animate-pulse"
                )}
                style={{ width: isPlaying ? '100%' : '0%' }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Oração em áudio gravada
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={clearRecording}
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {isRecording ? (
            <>
              <Button
                type="button"
                onClick={stopRecording}
                variant="destructive"
                className="gap-2"
              >
                <Square className="h-4 w-4 fill-current" />
                Parar ({formatTime(recordingTime)})
              </Button>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-sm text-muted-foreground">Gravando...</span>
              </div>
            </>
          ) : (
            <Button
              type="button"
              onClick={startRecording}
              variant="outline"
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              Gravar Oração em Áudio
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
