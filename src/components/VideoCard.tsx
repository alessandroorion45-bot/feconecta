import { Play, Eye, Heart, Clock } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VideoData {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  visibility: 'public' | 'private' | 'friends' | 'custom';
  views_count: number;
  likes_count: number;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface VideoCardProps {
  video: VideoData;
  onClick: () => void;
  showAuthor?: boolean;
}

export const VideoCard = ({ video, onClick, showAuthor = false }: VideoCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(video.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  return (
    <div
      className="group cursor-pointer rounded-xl overflow-hidden bg-card border shadow-sm hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <video
            src={video.video_url}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            muted
            preload="metadata"
          />
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-7 w-7 text-primary ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Stats overlay */}
        <div className="absolute bottom-2 right-2 flex gap-2">
          <span className="flex items-center gap-1 text-xs text-white bg-black/60 px-2 py-1 rounded-full">
            <Eye className="h-3 w-3" /> {video.views_count}
          </span>
          <span className="flex items-center gap-1 text-xs text-white bg-black/60 px-2 py-1 rounded-full">
            <Heart className="h-3 w-3" /> {video.likes_count}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex gap-3">
          {showAuthor && video.profiles && (
            <UserAvatar
              src={video.profiles.avatar_url}
              fallback={video.profiles.full_name}
              size="sm"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {video.title}
            </h3>
            {showAuthor && video.profiles && (
              <p className="text-sm text-muted-foreground mt-1">
                {video.profiles.full_name}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
