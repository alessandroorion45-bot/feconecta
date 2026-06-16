import { Timer, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useReadingTimer } from '@/hooks/useReadingTimer';

interface ReadingTimerProps {
  bookAbbrev?: string;
  chapter?: number;
}

const ReadingTimer = ({ bookAbbrev, chapter }: ReadingTimerProps) => {
  const { sessionSeconds, isRunning, stats, formatTime, formatTotalTime } = useReadingTimer(bookAbbrev, chapter);

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isRunning ? 'bg-green-500/20 animate-pulse' : 'bg-muted'}`}>
              <Timer className={`h-5 w-5 ${isRunning ? 'text-green-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sessão atual</p>
              <p className="text-xl font-bold text-primary">{formatTime(sessionSeconds)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tempo total</p>
              <p className="text-lg font-semibold">{formatTotalTime(stats.totalSeconds)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-muted">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sessões</p>
              <p className="text-lg font-semibold">{stats.totalSessions}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadingTimer;
