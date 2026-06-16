import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import UserAvatar from '@/components/UserAvatar';
import { Reaction, Participant } from '@/hooks/useSharedReading';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionBarProps {
  reactions: Reaction[];
  onReaction: (reaction: string) => void;
  participants: Participant[];
}

const REACTIONS = ['🙌', '🙏', '🎉', '❤️', '📖', '💪'];

export const ReactionBar = ({ reactions, onReaction, participants }: ReactionBarProps) => {
  const getParticipantProfile = (userId: string) => {
    return participants.find(p => p.user_id === userId)?.profile;
  };

  // Get recent reactions (last 5 seconds)
  const recentReactions = reactions.filter(r => {
    const reactionTime = new Date(r.created_at).getTime();
    const now = Date.now();
    return now - reactionTime < 5000;
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="py-3 px-4">
        {/* Floating reactions animation */}
        <div className="relative h-12 mb-2 overflow-hidden">
          <AnimatePresence>
            {recentReactions.map((reaction) => {
              const profile = getParticipantProfile(reaction.user_id);
              return (
                <motion.div
                  key={reaction.id}
                  initial={{ opacity: 0, y: 20, x: Math.random() * 200 }}
                  animate={{ opacity: 1, y: -30, x: Math.random() * 200 }}
                  exit={{ opacity: 0, y: -60 }}
                  transition={{ duration: 2 }}
                  className="absolute flex items-center gap-1 pointer-events-none"
                >
                  <UserAvatar
                    src={profile?.avatar_url}
                    fallback={profile?.full_name?.[0] || '?'}
                    size="xs"
                  />
                  <span className="text-2xl">{reaction.reaction}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Reaction buttons */}
        <div className="flex items-center justify-center gap-2">
          {REACTIONS.map((emoji) => (
            <motion.div key={emoji} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                className="text-2xl h-10 w-10 p-0 hover:bg-primary/10"
                onClick={() => onReaction(emoji)}
              >
                {emoji}
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
