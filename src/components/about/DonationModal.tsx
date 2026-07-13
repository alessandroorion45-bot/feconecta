import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { QrCode, CreditCard, Wallet, HandHeart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

type PaymentMethod = "pix" | "credit" | "debit" | "mp_balance";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "pix", label: "PIX", icon: <QrCode className="h-4 w-4" /> },
  { value: "credit", label: "Crédito", icon: <CreditCard className="h-4 w-4" /> },
  { value: "debit", label: "Débito", icon: <CreditCard className="h-4 w-4" /> },
  { value: "mp_balance", label: "Saldo MP", icon: <Wallet className="h-4 w-4" /> },
];

const DonationModal = ({ open, onOpenChange }: DonationModalProps) => {
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(20);
  const [customAmount, setCustomAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const finalAmount = customAmount ? Number(customAmount.replace(",", ".")) : selectedAmount;
  const isValidAmount = !!finalAmount && finalAmount > 0;

  const handleSelectQuick = (value: number) => {
    setSelectedAmount(value);
    setCustomAmount("");
  };

  const handleCustomChange = (value: string) => {
    const sanitized = value.replace(/[^0-9,.]/g, "");
    setCustomAmount(sanitized);
    setSelectedAmount(null);
  };

  const handleSubmit = async () => {
    if (!isValidAmount) return;
    setSubmitting(true);
    // A geração real da preferência de pagamento no Mercado Pago depende
    // de uma Edge Function com o Access Token do projeto, que ainda não
    // foi configurado. Sem fabricar um fluxo de pagamento falso.
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    toast({
      title: "Doações chegando em breve",
      description: "A integração com o Mercado Pago está sendo finalizada. Assim que estiver ativa, você poderá concluir sua doação por aqui.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HandHeart className="h-5 w-5 text-amber-500" />
            Fazer uma doação
          </DialogTitle>
          <DialogDescription>
            Qualquer valor ajuda a manter o Aliança Kingdom no ar e gratuito para todos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label className="mb-2 block text-sm font-medium">Escolha um valor</Label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleSelectQuick(amount)}
                  className={cn(
                    "rounded-lg border py-2.5 text-sm font-semibold transition-all hover:scale-[1.03]",
                    selectedAmount === amount && !customAmount
                      ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-border bg-muted/40 text-foreground",
                  )}
                >
                  R$ {amount}
                </button>
              ))}
              <div className="col-span-3 sm:col-span-1">
                <Input
                  placeholder="Outro valor"
                  value={customAmount}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className="text-center"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Forma de pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setMethod(pm.value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all",
                    method === pm.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-foreground",
                  )}
                >
                  {pm.icon}
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(!!v)} />
            Prefiro doar de forma anônima
          </label>

          <Button
            onClick={handleSubmit}
            disabled={!isValidAmount || submitting}
            className="w-full h-11 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Doar {isValidAmount ? `R$ ${finalAmount!.toFixed(2).replace(".", ",")}` : ""}</>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            Pagamento processado com segurança pelo Mercado Pago. Sem taxas extras para você.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonationModal;
