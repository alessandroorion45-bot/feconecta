import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Plus, Users, Play, Flag, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PostAuthorBadges } from "@/components/PostAuthorBadges";
import { EventMediaUpload } from "@/components/events/EventMediaUpload";
import { useLanguage, SOUTH_AMERICAN_COUNTRIES } from "@/contexts/LanguageContext";
import type { User } from "@supabase/supabase-js";

const Events = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [eventsFromCountry, setEventsFromCountry] = useState<any[]>([]);
  const [eventsFromOther, setEventsFromOther] = useState<any[]>([]);
  const [showOtherCountries, setShowOtherCountries] = useState(false);
  const { toast } = useToast();
  const { trackActivity } = useActivityTracking();
  const { t, language } = useLanguage();
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    city: "",
    event_date: "",
    image_url: null as string | null,
    video_url: null as string | null,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Load user's country
        const { data: profile } = await supabase
          .from("profiles")
          .select("country")
          .eq("id", session.user.id)
          .single();
        
        if (profile?.country) {
          setUserCountry(profile.country);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    loadEvents();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [userCountry]);

  const getCountryName = (code: string) => {
    const country = SOUTH_AMERICAN_COUNTRIES.find(c => c.code === code);
    return country?.name || code;
  };

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        profiles:user_id (username, full_name, avatar_url, church_name, country)
      `)
      .order("event_date", { ascending: true });

    if (!error && data) {
      // Separate events by country
      if (userCountry) {
        const fromSame = data.filter(e => e.country === userCountry || e.profiles?.country === userCountry);
        const fromOther = data.filter(e => e.country !== userCountry && e.profiles?.country !== userCountry);
        setEventsFromCountry(fromSame);
        setEventsFromOther(fromOther);
      } else {
        setEventsFromCountry([]);
        setEventsFromOther(data);
      }
    }
  };

  const handleCreateEvent = async () => {
    if (!user || !newEvent.title || !newEvent.event_date) return;

    const { error } = await supabase
      .from("events")
      .insert([
        {
          user_id: user.id,
          title: newEvent.title,
          description: newEvent.description,
          location: newEvent.location,
          city: newEvent.city,
          event_date: newEvent.event_date,
          image_url: newEvent.image_url,
          video_url: newEvent.video_url,
          country: userCountry,
        },
      ]);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Evento criado!",
        description: "Seu evento foi publicado com sucesso",
      });
      setNewEvent({ 
        title: "", 
        description: "", 
        location: "", 
        city: "", 
        event_date: "",
        image_url: null,
        video_url: null,
      });
      setDialogOpen(false);
      loadEvents();
    }
  };

  const handleParticipate = async (eventId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("event_participants")
      .insert([{ event_id: eventId, user_id: user.id }]);

    if (!error) {
      trackActivity("event_participated");
      toast({
        title: "Confirmado!",
        description: "Você confirmou presença no evento",
      });
      loadEvents();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-divine bg-clip-text text-transparent leading-tight pt-1">
              Eventos
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Descubra e participe de eventos cristãos
            </p>
          </div>

          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground shadow-glow gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nome do evento"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Descrição do evento..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    rows={4}
                  />
                  <Input
                    placeholder="Local (ex: Igreja Batista Central)"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  />
                  <Input
                    placeholder="Cidade"
                    value={newEvent.city}
                    onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                  />
                  
                  {/* Media Upload Section */}
                  <EventMediaUpload
                    imageUrl={newEvent.image_url}
                    videoUrl={newEvent.video_url}
                    onImageChange={(url) => setNewEvent({ ...newEvent, image_url: url })}
                    onVideoChange={(url) => setNewEvent({ ...newEvent, video_url: url })}
                    userId={user.id}
                  />

                  <Input
                    type="datetime-local"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                  />
                  <Button onClick={handleCreateEvent} className="w-full bg-gradient-primary">
                    Publicar Evento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Events from user's country */}
        {userCountry && eventsFromCountry.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold flex items-center gap-2 text-primary mb-4">
              <Flag className="h-5 w-5" />
              {t('events.nearYou')} ({eventsFromCountry.length})
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {eventsFromCountry.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  playingVideo={playingVideo}
                  setPlayingVideo={setPlayingVideo}
                  handleParticipate={handleParticipate}
                  language={language}
                />
              ))}
            </div>
          </div>
        )}

        {/* Events from other countries */}
        {eventsFromOther.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2 text-muted-foreground">
                <Globe className="h-5 w-5" />
                {t('events.otherCountries')} ({eventsFromOther.length})
              </h2>
              {userCountry && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowOtherCountries(!showOtherCountries)}
                >
                  {showOtherCountries ? t('common.seeLess') : t('common.seeMore')}
                </Button>
              )}
            </div>
            {(showOtherCountries || !userCountry) && (
              <div className="grid gap-6 md:grid-cols-2">
                {eventsFromOther.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    playingVideo={playingVideo}
                    setPlayingVideo={setPlayingVideo}
                    handleParticipate={handleParticipate}
                    language={language}
                    showCountry
                    getCountryName={getCountryName}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {eventsFromCountry.length === 0 && eventsFromOther.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {language === 'pt' ? "Nenhum evento encontrado" :
             language === 'es' ? "No se encontraron eventos" :
             language === 'nl' ? "Geen evenementen gevonden" :
             "No events found"}
          </div>
        )}
      </main>
    </div>
  );
};

// Separate EventCard component
interface EventCardProps {
  event: any;
  playingVideo: string | null;
  setPlayingVideo: (id: string | null) => void;
  handleParticipate: (eventId: string) => void;
  language: string;
  showCountry?: boolean;
  getCountryName?: (code: string) => string;
}

const EventCard = ({ event, playingVideo, setPlayingVideo, handleParticipate, language, showCountry, getCountryName }: EventCardProps) => {
  const dateLocale = language === 'pt' ? 'pt-BR' : 
                     language === 'es' ? 'es-ES' : 
                     language === 'nl' ? 'nl-NL' : 'en-US';
  
  return (
    <Card className="shadow-medium flex flex-col overflow-hidden">
      {/* Event Image */}
      {event.image_url && (
        <div className="relative w-full h-48">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {event.video_url && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
              onClick={() => setPlayingVideo(event.id)}
            >
              <Play className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
      
      {/* Video Player Modal */}
      {playingVideo === event.id && event.video_url && (
        <Dialog open={true} onOpenChange={() => setPlayingVideo(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{event.title}</DialogTitle>
            </DialogHeader>
            <video
              src={event.video_url}
              controls
              autoPlay
              className="w-full rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}

      <CardHeader>
        <PostAuthorBadges
          userId={event.user_id}
          username={event.profiles?.username}
          fullName={event.profiles?.full_name}
          avatarUrl={event.profiles?.avatar_url}
        />
        <h3 className="text-xl font-bold mt-3">{event.title}</h3>
        {showCountry && event.country && getCountryName && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Flag className="h-3 w-3" />
            {getCountryName(event.country)}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
          {event.description}
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {new Date(event.event_date).toLocaleDateString(dateLocale, {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span>
              {event.location} - {event.city}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => handleParticipate(event.id)}
        >
          <Users className="h-4 w-4" />
          {language === 'pt' ? 'Participar' : 
           language === 'es' ? 'Participar' : 
           language === 'nl' ? 'Deelnemen' : 
           'Participate'} ({event.participant_count})
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Events;