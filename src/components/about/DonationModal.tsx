import { useState, useEffect, useRef } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HandHeart, Loader2, ArrowLeft, PartyPopper, Clock, XCircle, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

let mpInitialized = false;
function ensureMercadoPagoInitialized() {
  if (mpInitialized) return;
  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  if (!publicKey) {
    console.error("[DonationModal] VITE_MERCADOPAGO_PUBLIC_KEY não configurada.");
    return;
  }
  initMercadoPago(publicKey, { locale: "pt-BR" });
  mpInitialized = true;
}

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

type Step = "amount" | "payment" | "result";

interface PaymentResult {
  status: "approved" | "pending" | "rejected" | string;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
}

const DonationModal = ({ open, onOpenChange }: DonationModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(20);
  const [customAmount, setCustomAmount] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [showOnWall, setShowOnWall] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorCity, setDonorCity] = useState("");
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const submittingRef = useRef(false);

  const finalAmount = customAmount ? Number(customAmount.replace(",", ".")) : selectedAmount;
  const isValidAmount = !!finalAmount && finalAmount > 0;

  useEffect(() => {
    if (open) ensureMercadoPagoInitialized();
  }, [open]);

  useEffect(() => {
    if (!open) {
      // reseta o wizard ao fechar, pra próxima abertura começar do zero
      setTimeout(() => {
        setStep("amount");
        setResult(null);
        setCopied(false);
      }, 200);
    }
  }, [open]);

  const handleSelectQuick = (value: number) => {
    setSelectedAmount(value);
    setCustomAmount("");
  };

  const handleCustomChange = (value: string) => {
    const sanitized = value.replace(/[^0-9,.]/g, "");
    setCustomAmount(sanitized);
    setSelectedAmount(null);
  };

  const handleAnonymousChange = (checked: boolean) => {
    setAnonymous(checked);
    if (checked) setShowOnWall(false);
  };

  const handleBrickSubmit = async ({ formData }: { formData: any }) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      const deviceId = (window as any).MP_DEVICE_SESSION_ID;

      const { data, error } = await supabase.functions.invoke("process-donation-payment", {
        body: {
          amount: finalAmount,
          isAnonymous: anonymous,
          isPublic: showOnWall,
          donorName: showOnWall ? donorName : null,
          donorCity: showOnWall ? donorCity : null,
          formData,
          deviceId,
        },
      });

      if (error || data?.error) {
        toast({
          title: "Pagamento não aprovado",
          description: data?.error || "Verifique os dados e tente novamente.",
          variant: "destructive",
        });
        throw new Error(data?.error || "Falha no pagamento");
      }

      setResult(data);
      setStep("result");
    } finally {
      submittingRef.current = false;
    }
  };

  const copyPixCode = async () => {
    if (!result?.qrCode) return;
    await navigator.clipboard.writeText(result.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {step === "amount" && (
          <>
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

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox checked={anonymous} onCheckedChange={(v) => handleAnonymousChange(!!v)} />
                  Prefiro doar de forma anônima
                </label>

                {!anonymous && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <Checkbox checked={showOnWall} onCheckedChange={(v) => setShowOnWall(!!v)} />
                    Quero aparecer no mural de apoiadores (opcional)
                  </label>
                )}

                {showOnWall && !anonymous && (
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <Input placeholder="Seu nome" value={donorName} onChange={(e) => setDonorName(e.target.value)} />
                    <Input placeholder="Cidade (opcional)" value={donorCity} onChange={(e) => setDonorCity(e.target.value)} />
                  </div>
                )}
              </div>

              <Button
                onClick={() => setStep("payment")}
                disabled={!isValidAmount}
                className="w-full h-11 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Continuar {isValidAmount ? `· R$ ${finalAmount!.toFixed(2).replace(".", ",")}` : ""}
              </Button>
            </div>
          </>
        )}

        {step === "payment" && isValidAmount && (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => setStep("amount")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1 w-fit"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
              <DialogTitle className="text-xl">
                Doar R$ {finalAmount!.toFixed(2).replace(".", ",")}
              </DialogTitle>
              <DialogDescription>
                Pagamento processado com segurança pelo Mercado Pago.
              </DialogDescription>
            </DialogHeader>

            <Payment
              initialization={{ amount: finalAmount! }}
              customization={{
                paymentMethods: {
                  bankTransfer: "all",
                },
              }}
              onSubmit={handleBrickSubmit}
              onError={(err) => console.error("[DonationModal] Payment Brick error:", err)}
            />
          </>
        )}

        {step === "result" && result && (
          <div className="text-center py-2">
            {result.status === "approved" && (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <PartyPopper className="h-7 w-7 text-emerald-500" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center">Muito obrigado! 🎉</DialogTitle>
                  <DialogDescription className="text-center">
                    Sua doação foi recebida com alegria. Que Deus abençoe sua generosidade.
                  </DialogDescription>
                </DialogHeader>
              </>
            )}

            {result.status === "pending" && result.qrCode && (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                  <Clock className="h-7 w-7 text-amber-500" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center">Escaneie o PIX para concluir</DialogTitle>
                  <DialogDescription className="text-center">
                    Assim que o pagamento for confirmado, sua doação é registrada automaticamente.
                  </DialogDescription>
                </DialogHeader>
                {result.qrCodeBase64 && (
                  <img
                    src={`data:image/png;base64,${result.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="mx-auto my-4 h-48 w-48 rounded-lg border border-border"
                  />
                )}
                <Button variant="outline" onClick={copyPixCode} className="w-full gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Código copiado!" : "Copiar código PIX"}
                </Button>
              </>
            )}

            {result.status === "pending" && !result.qrCode && (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                  <Clock className="h-7 w-7 text-amber-500" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center">Pagamento em processamento</DialogTitle>
                  <DialogDescription className="text-center">
                    Assim que for aprovado, sua doação é confirmada automaticamente.
                  </DialogDescription>
                </DialogHeader>
              </>
            )}

            {(result.status === "rejected" || result.status === "cancelled") && (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center">Não foi possível concluir</DialogTitle>
                  <DialogDescription className="text-center">
                    O pagamento não foi aprovado. Nenhum valor foi cobrado.
                  </DialogDescription>
                </DialogHeader>
                <Button variant="outline" onClick={() => setStep("payment")} className="w-full mt-3">
                  Tentar novamente
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DonationModal;
