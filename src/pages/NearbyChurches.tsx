import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Phone, Clock, Plus, ChevronLeft, Edit2, Church, MessageCircle, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ChurchData {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  denomination: string | null;
  cover_image_url: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  social_media: string | null;
  worship_days: string[] | null;
  worship_times: string[] | null;
  operating_hours: string | null;
  created_at: string;
}

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DENOMINATIONS = ["Assembleia de Deus", "Batista", "Presbiteriana", "Metodista", "Católica", "Adventista", "Quadrangular", "Universal", "Sara Nossa Terra", "Comunidade", "Interdenominacional", "Outra"];

const STATES_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const NearbyChurches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState<string>("");
  const [filterCity, setFilterCity] = useState("");
  const [selectedChurch, setSelectedChurch] = useState<ChurchData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingChurch, setEditingChurch] = useState<ChurchData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "", description: "", denomination: "", country: "Brasil", state: "", city: "", neighborhood: "", address: "", phone: "", whatsapp: "", social_media: "", worship_days: [] as string[], worship_times: [""], operating_hours: ""
  });

  useEffect(() => { loadChurches(); }, []);

  const loadChurches = async () => {
    setLoading(true);
    const { data } = await supabase.from("nearby_churches").select("*").order("created_at", { ascending: false });
    if (data) setChurches(data as ChurchData[]);
    setLoading(false);
  };

  const filtered = churches.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.denomination?.toLowerCase().includes(search.toLowerCase());
    const matchState = !filterState || c.state === filterState;
    const matchCity = !filterCity || c.city?.toLowerCase().includes(filterCity.toLowerCase());
    return matchSearch && matchState && matchCity;
  });

  const resetForm = () => {
    setForm({ name: "", description: "", denomination: "", country: "Brasil", state: "", city: "", neighborhood: "", address: "", phone: "", whatsapp: "", social_media: "", worship_days: [], worship_times: [""], operating_hours: "" });
    setEditingChurch(null);
  };

  const openEditForm = (church: ChurchData) => {
    setForm({
      name: church.name, description: church.description || "", denomination: church.denomination || "",
      country: church.country || "Brasil", state: church.state || "", city: church.city || "",
      neighborhood: church.neighborhood || "", address: church.address || "", phone: church.phone || "",
      whatsapp: church.whatsapp || "", social_media: church.social_media || "",
      worship_days: church.worship_days || [], worship_times: church.worship_times || [""],
      operating_hours: church.operating_hours || ""
    });
    setEditingChurch(church);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!user || !form.name.trim()) return;
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      denomination: form.denomination || null,
      country: form.country, state: form.state || null, city: form.city || null,
      neighborhood: form.neighborhood || null, address: form.address || null,
      phone: form.phone || null, whatsapp: form.whatsapp || null, social_media: form.social_media || null,
      worship_days: form.worship_days.length > 0 ? form.worship_days : null,
      worship_times: form.worship_times.filter(t => t.trim()) || null,
      operating_hours: form.operating_hours || null,
      user_id: user.id,
    };

    if (editingChurch) {
      const { error } = await supabase.from("nearby_churches").update(payload).eq("id", editingChurch.id);
      if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); }
      else { toast({ title: "Igreja atualizada! ⛪" }); }
    } else {
      const { error } = await supabase.from("nearby_churches").insert(payload);
      if (error) { toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Igreja cadastrada com sucesso! ⛪" }); }
    }

    setSubmitting(false);
    setShowForm(false);
    resetForm();
    loadChurches();
  };

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      worship_days: f.worship_days.includes(day) ? f.worship_days.filter(d => d !== day) : [...f.worship_days, day]
    }));
  };

  // Detail view
  if (selectedChurch) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedChurch(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <Card className="shadow-divine">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedChurch.name}</CardTitle>
                  {selectedChurch.denomination && <Badge variant="outline" className="mt-2">{selectedChurch.denomination}</Badge>}
                </div>
                {user?.id === selectedChurch.user_id && (
                  <Button variant="outline" size="sm" onClick={() => { setSelectedChurch(null); openEditForm(selectedChurch); }}>
                    <Edit2 className="h-4 w-4 mr-1" /> Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedChurch.description && <p className="text-muted-foreground leading-relaxed">{selectedChurch.description}</p>}

              <div className="grid gap-3 sm:grid-cols-2">
                {selectedChurch.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Endereço</p>
                      <p className="text-sm text-muted-foreground">{selectedChurch.address}{selectedChurch.neighborhood ? `, ${selectedChurch.neighborhood}` : ""}</p>
                      <p className="text-sm text-muted-foreground">{[selectedChurch.city, selectedChurch.state, selectedChurch.country].filter(Boolean).join(", ")}</p>
                    </div>
                  </div>
                )}
                {selectedChurch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Telefone</p>
                      <p className="text-sm text-muted-foreground">{selectedChurch.phone}</p>
                    </div>
                  </div>
                )}
                {selectedChurch.whatsapp && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">WhatsApp</p>
                      <a href={`https://wa.me/${selectedChurch.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">{selectedChurch.whatsapp}</a>
                    </div>
                  </div>
                )}
                {selectedChurch.social_media && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Rede Social</p>
                      <p className="text-sm text-muted-foreground">{selectedChurch.social_media}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedChurch.worship_days && selectedChurch.worship_days.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Dias e Horários de Culto</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedChurch.worship_days.map(d => <Badge key={d} variant="secondary">{d}</Badge>)}
                  </div>
                  {selectedChurch.worship_times && (
                    <div className="flex flex-wrap gap-2">
                      {selectedChurch.worship_times.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}
                    </div>
                  )}
                </div>
              )}

              {selectedChurch.operating_hours && (
                <div>
                  <h3 className="font-semibold mb-1">Horário de Funcionamento</h3>
                  <p className="text-sm text-muted-foreground">{selectedChurch.operating_hours}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent mb-2">Igrejas Próximas</h1>
          <p className="text-muted-foreground">Encontre e cadastre igrejas na sua região</p>
        </div>

        {user && (
          <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="w-full mb-6 bg-gradient-primary text-primary-foreground shadow-glow">
                <Plus className="h-4 w-4 mr-2" /> Cadastrar Igreja
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingChurch ? "Editar Igreja" : "Cadastrar Nova Igreja"}</DialogTitle>
                <DialogDescription>Preencha os dados da igreja</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome da Igreja *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Igreja Batista Central" /></div>
                <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descrição..." rows={3} /></div>
                <div><Label>Denominação</Label>
                  <Select value={form.denomination} onValueChange={v => setForm(f => ({ ...f, denomination: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{DENOMINATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Estado</Label>
                    <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>{STATES_BR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Cidade</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                </div>
                <div><Label>Bairro</Label><Input value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} /></div>
                <div><Label>Endereço</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Rua, número..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                  <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
                </div>
                <div><Label>Rede Social</Label><Input value={form.social_media} onChange={e => setForm(f => ({ ...f, social_media: e.target.value }))} placeholder="@instagram ou link" /></div>
                <div>
                  <Label>Dias de Culto</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DAYS.map(d => (
                      <Button key={d} type="button" size="sm" variant={form.worship_days.includes(d) ? "default" : "outline"} onClick={() => toggleDay(d)}>{d.slice(0,3)}</Button>
                    ))}
                  </div>
                </div>
                <div><Label>Horários de Culto</Label><Input value={form.worship_times.join(", ")} onChange={e => setForm(f => ({ ...f, worship_times: e.target.value.split(",").map(t => t.trim()) }))} placeholder="09:00, 19:00" /></div>
                <div><Label>Horário de Funcionamento</Label><Input value={form.operating_hours} onChange={e => setForm(f => ({ ...f, operating_hours: e.target.value }))} placeholder="Seg-Sex 08:00-18:00" /></div>
                <Button onClick={handleSubmit} disabled={!form.name.trim() || submitting} className="w-full">
                  {submitting ? "Salvando..." : editingChurch ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou denominação..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-3">
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-24"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATES_BR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Filtrar por cidade..." value={filterCity} onChange={e => setFilterCity(e.target.value)} className="flex-1" />
          </div>
        </div>

        {/* Church list */}
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Church className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma igreja encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a cadastrar uma igreja!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(church => (
              <Card key={church.id} className="cursor-pointer hover:shadow-divine transition-shadow" onClick={() => setSelectedChurch(church)}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                      <Church className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg">{church.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {church.denomination && <Badge variant="outline" className="text-xs">{church.denomination}</Badge>}
                        {church.city && <Badge variant="secondary" className="text-xs"><MapPin className="h-3 w-3 mr-1 inline" />{church.city}{church.state ? ` - ${church.state}` : ""}</Badge>}
                      </div>
                      {church.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{church.description}</p>}
                      {church.worship_days && church.worship_days.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {church.worship_days.map(d => <span key={d} className="text-xs bg-muted px-2 py-0.5 rounded">{d}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NearbyChurches;
