import { Badge } from "@/components/ui/badge";
import { MINISTRIES } from "./MinistriesSelector";

interface MemberMinistryBadgesProps {
  ministries: string[] | null;
  maxShow?: number;
}

const MemberMinistryBadges = ({ ministries, maxShow = 3 }: MemberMinistryBadgesProps) => {
  if (!ministries || ministries.length === 0) return null;

  const displayMinistries = ministries.slice(0, maxShow);
  const remaining = ministries.length - maxShow;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {displayMinistries.map(ministryId => {
        const ministry = MINISTRIES.find(m => m.id === ministryId);
        if (!ministry) return null;
        
        return (
          <Badge 
            key={ministryId}
            variant="outline"
            className="text-xs px-1.5 py-0.5 bg-primary/5"
          >
            <span className="mr-1">{ministry.emoji}</span>
            {ministry.name.replace("Ministério de ", "").replace("Ministério ", "")}
          </Badge>
        );
      })}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
          +{remaining}
        </Badge>
      )}
    </div>
  );
};

export default MemberMinistryBadges;
