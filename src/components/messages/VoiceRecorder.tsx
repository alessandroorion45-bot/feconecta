import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Mic, X, Send, Play, Pause, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, waveform: number[], duration: number) => void;
  onCancel?: () => void;
  maxDuration?: number; // em segundos
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  maxDuration = 600 // 10 minutos
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string>('');

  // Motion values para animação de deslizar para cancelar
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0], [0, 1]);
  const scale = useTransform(x, [-100, 0], [0.8, 1]);

  // Iniciar gravação
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup AudioContext para waveform
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioUrlRef.current = URL.createObjectURL(audioBlob);
        setIsPreview(true);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      setIsRecording(true);
      setDuration(0);
      audioChunksRef.current = [];

      // Timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Animar waveform
      animateWaveform();
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      setIsRecording(false);
    }
  };

  // Animar waveform em tempo real
  const animateWaveform = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const draw = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Pegar apenas alguns valores para o waveform
      const simplified = [];
      for (let i = 0; i < 32; i++) {
        simplified.push(dataArray[i * 2] || 0);
      }

      setWaveform(simplified);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Cancelar gravação
  const handleCancel = () => {
    stopRecording();
    audioChunksRef.current = [];
    setWaveform([]);
    setDuration(0);
    setIsPreview(false);

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    onCancel?.();
  };

  // Enviar gravação
  const handleSend = () => {
    if (audioChunksRef.current.length === 0) return;

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    onRecordingComplete(audioBlob, waveform, duration);

    // Limpar
    handleCancel();
  };

  // Preview play/pause
  const togglePreviewPlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  // Deletar preview
  const handleDeletePreview = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }
    setIsPreview(false);
    setWaveform([]);
    setDuration(0);
    audioChunksRef.current = [];
  };

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // MODO PREVIEW
  if (isPreview) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-primary"
      >
        <audio
          ref={audioRef}
          src={audioUrlRef.current}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Play/Pause */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePreviewPlayback}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </motion.button>

        {/* Waveform */}
        <div className="flex-1">
          <div className="flex items-center gap-0.5 h-8">
            {waveform.map((height, index) => (
              <div
                key={index}
                className="flex-1 bg-primary/50 rounded-full"
                style={{ height: `${Math.max(4, height / 4)}px` }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{formatTime(duration)}</p>
        </div>

        {/* Ações */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDeletePreview}
          className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center"
        >
          <Trash2 className="h-5 w-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg"
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </motion.div>
    );
  }

  // MODO GRAVANDO
  if (isRecording) {
    return (
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) {
            handleCancel();
          }
        }}
        style={{ x, opacity, scale }}
        className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-red-500"
      >
        {/* Indicador "gravando" */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-3 h-3 rounded-full bg-red-500"
          />
          <Mic className="h-5 w-5 text-red-500" />
        </div>

        {/* Timer */}
        <div className="text-sm font-mono font-bold text-red-600 dark:text-red-400">
          {formatTime(duration)}
        </div>

        {/* Waveform animado */}
        <div className="flex-1 flex items-center gap-0.5 h-8">
          {waveform.map((height, index) => (
            <motion.div
              key={index}
              animate={{ scaleY: [1, 1.5, 1] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: index * 0.05
              }}
              className="flex-1 bg-red-500/50 rounded-full"
              style={{ height: `${Math.max(4, height / 4)}px` }}
            />
          ))}
        </div>

        {/* Dica */}
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          ← Deslize para cancelar
        </p>

        {/* Botão parar */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={stopRecording}
          className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
        >
          <div className="w-4 h-4 bg-white rounded-sm" />
        </motion.button>
      </motion.div>
    );
  }

  // MODO INICIAL (botão para gravar)
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onTouchStart={startRecording}
      onMouseDown={startRecording}
      className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
      title="Segurar para gravar"
    >
      <Mic className="h-6 w-6" />
    </motion.button>
  );
};
