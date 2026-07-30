import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { TwoFactorSetup } from "@/components/admin/TwoFactorSetup";

const AdminSecurity = () => {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-500" /> Segurança do Painel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Camadas ativas: login → papel de admin → PIN do cofre → (opcional) 2FA por app autenticador.
          </p>
        </div>

        <TwoFactorSetup />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como funciona o 2FA aqui</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• É <b>opcional</b>: só passa a ser exigido depois que você ativa e confirma um código válido.</p>
            <p>• Ao entrar no painel, além do PIN, você digitará o código de 6 dígitos do app.</p>
            <p>• <b>Perdeu o celular?</b> Você pode desativar o 2FA aqui (se ainda tiver sessão) ou removê-lo pelo painel do Supabase — então nunca fica trancado pra fora.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSecurity;
