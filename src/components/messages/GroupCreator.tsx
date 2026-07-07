import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarPro } from '@/components/AvatarPro';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Friend {
  id: string;
  name: string;
  avatar?: string;
}

interface GroupCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  onCreate: (data: {
    name: string;
    description: string;
    avatar?: File;
    memberIds: string[];
  }) => Promise<void>;
}

export const GroupCreator: React.FC<GroupCreatorProps> = ({
  isOpen,
  onClose,
  friends,
  onCreate
}) => {
  const [step, setStep] = useState(1); // 1: Info, 2: Members
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Filtrar amigos
  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle member
  const toggleMember = (memberId: string) => {
    const newSet = new Set(selectedMembers);
    if (newSet.has(memberId)) {
      newSet.delete(memberId);
    } else {
      newSet.add(memberId);
    }
    setSelectedMembers(newSet);
  };

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create group
  const handleCreate = async () => {
    if (!groupName.trim()) {
      alert('Digite um nome para o grupo');
      return;
    }

    if (selectedMembers.size === 0) {
      alert('Selecione pelo menos um membro');
      return;
    }

    setIsCreating(true);

    try {
      await onCreate({
        name: groupName,
        description,
        avatar: avatarFile || undefined,
        memberIds: Array.from(selectedMembers)
      });

      // Reset
      setGroupName('');
      setDescription('');
      setAvatarFile(null);
      setAvatarPreview('');
      setSelectedMembers(new Set());
      setStep(1);
      onClose();
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      alert('Erro ao criar grupo. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {step === 1 ? 'Criar Grupo' : 'Adicionar Membros'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Configure as informações do grupo'
              : `${selectedMembers.size} membro(s) selecionado(s)`}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Info do Grupo */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                      <Users />
                    </AvatarFallback>
                  )}
                </Avatar>
                <label
                  htmlFor="group-avatar"
                  className="absolute -bottom-1 -right-1 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                >
                  <Upload className="h-4 w-4" />
                  <input
                    id="group-avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold">Foto do Grupo</p>
                <p className="text-xs text-muted-foreground">
                  Clique no ícone para adicionar
                </p>
              </div>
            </div>

            {/* Nome */}
            <div>
              <Label htmlFor="group-name">Nome do Grupo *</Label>
              <Input
                id="group-name"
                placeholder="Ex: Célula de Oração"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {groupName.length}/50
              </p>
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="group-description">Descrição (opcional)</Label>
              <Textarea
                id="group-description"
                placeholder="Descreva o propósito do grupo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/200
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Selecionar Membros */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Busca */}
            <Input
              placeholder="Buscar amigos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Lista de amigos */}
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-2 space-y-2">
                {filteredFriends.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum amigo encontrado
                  </p>
                ) : (
                  filteredFriends.map((friend) => (
                    <motion.div
                      key={friend.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleMember(friend.id)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedMembers.has(friend.id)}
                        onCheckedChange={() => toggleMember(friend.id)}
                      />

                      <AvatarPro src={friend.avatar} name={friend.name} size="sm" clickable={false} />

                      <p className="font-semibold flex-1">{friend.name}</p>

                      {selectedMembers.has(friend.id) && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={() => setStep(2)} disabled={!groupName.trim()}>
                Próximo
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={selectedMembers.size === 0 || isCreating}
              >
                {isCreating ? 'Criando...' : 'Criar Grupo'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
