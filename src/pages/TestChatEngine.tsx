import React, { useState } from 'react';
import { useChatEngine } from '@/hooks/useChatEngine';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Users, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TestChatEngine() {
  const {
    conversations,
    selectedConversation,
    messages,
    typingUsers,
    onlineUsers,
    isLoading,
    isSending,
    sendMessage,
    setSelectedConversation,
    getOrCreatePrivateConversation
  } = useChatEngine();

  const [messageText, setMessageText] = useState('');
  const [testUserId, setTestUserId] = useState('');

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    await sendMessage(messageText);
    setMessageText('');
  };

  const handleCreateConversation = async () => {
    if (!testUserId.trim()) return;

    const conv = await getOrCreatePrivateConversation(testUserId);
    if (conv) {
      setSelectedConversation(conv);
      setTestUserId('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <Header />

      <div className="container mx-auto p-4 mt-20">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧪 Teste do Sistema de Mensagens
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="ID do usuário para criar conversa"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
              />
              <Button onClick={handleCreateConversation}>
                Criar Conversa
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">Conversas</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {conversations.length}
                </p>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">Online</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {onlineUsers.size}
                </p>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold">Mensagens</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {messages.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          {/* LISTA DE CONVERSAS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                💬 Conversas ({conversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {conversations.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">
                    Nenhuma conversa ainda
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedConversation?.id === conv.id
                          ? 'bg-primary/10 border-l-4 border-l-primary'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {conv.other_user?.avatar_url ? (
                            <img
                              src={conv.other_user.avatar_url}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {conv.other_user?.full_name?.[0] || '?'}
                            </div>
                          )}

                          <div>
                            <p className="font-semibold">
                              {conv.name || conv.other_user?.full_name || 'Conversa'}
                              {conv.other_user?.is_online && (
                                <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full" />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {conv.last_message || 'Sem mensagens'}
                            </p>
                          </div>
                        </div>

                        {conv.unread_count && conv.unread_count > 0 ? (
                          <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                            {conv.unread_count}
                          </div>
                        ) : null}
                      </div>

                      {conv.last_message_at && (
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.last_message_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* MENSAGENS */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedConversation ? (
                  <>
                    💬 {selectedConversation.name || selectedConversation.other_user?.full_name || 'Conversa'}
                    {selectedConversation.other_user?.is_online && (
                      <span className="ml-2 text-sm text-green-600 font-normal">
                        • Online
                      </span>
                    )}
                  </>
                ) : (
                  'Selecione uma conversa'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {selectedConversation ? (
                <>
                  <ScrollArea className="h-[500px] p-4">
                    {messages.length === 0 ? (
                      <p className="text-center text-muted-foreground">
                        Nenhuma mensagem ainda. Envie a primeira!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => {
                          const isMine = msg.sender_id === selectedConversation.participant_1_id;

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                  isMine
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs opacity-70">
                                    {formatDistanceToNow(new Date(msg.created_at), {
                                      addSuffix: true,
                                      locale: ptBR
                                    })}
                                  </p>

                                  {isMine && (
                                    <span className="text-xs">
                                      {msg.status === 'read' && '✓✓'}
                                      {msg.status === 'delivered' && '✓✓'}
                                      {msg.status === 'sent' && '✓'}
                                      {msg.status === 'sending' && '⏱️'}
                                      {msg.status === 'failed' && '❌'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                        <span>
                          {typingUsers[0].user_name} está{' '}
                          {typingUsers[0].is_recording ? 'gravando áudio' : 'digitando'}...
                        </span>
                      </div>
                    )}
                  </ScrollArea>

                  {/* INPUT */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite uma mensagem..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={isSending}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || isSending}
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Selecione uma conversa para começar</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* DEBUG INFO */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">🐛 Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[200px]">
              {JSON.stringify(
                {
                  totalConversations: conversations.length,
                  selectedConversation: selectedConversation?.id,
                  totalMessages: messages.length,
                  onlineUsers: Array.from(onlineUsers),
                  typingUsers: typingUsers.length,
                  isLoading,
                  isSending
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
