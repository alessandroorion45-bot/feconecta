import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Flag, Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReportContentModal } from "./ReportContentModal";

interface ContentActionsMenuProps {
  currentUserId: string | undefined;
  ownerId: string;
  contentType: string;
  contentId: string;
  /** trecho curto do conteúdo pra contexto da denúncia */
  contentSnippet?: string;
  shareUrl: string;
  shareText?: string;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  className?: string;
}

export function ContentActionsMenu({
  currentUserId,
  ownerId,
  contentType,
  contentId,
  contentSnippet,
  shareUrl,
  shareText,
  onEdit,
  onDelete,
  className,
}: ContentActionsMenuProps) {
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = !!currentUserId && currentUserId === ownerId;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copiado! 🔗" });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "FeConecta", text: shareText, url: shareUrl });
      } else {
        await handleCopyLink();
      }
    } catch {
      // usuário cancelou o share nativo
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      setConfirmDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={className || "h-8 w-8"}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwner ? (
            <>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => setConfirmDeleteOpen(true)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {currentUserId && (
                <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-destructive">
                  <Flag className="h-4 w-4 mr-2" />
                  Denunciar publicação
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {currentUserId && (
        <ReportContentModal
          open={reportOpen}
          onOpenChange={setReportOpen}
          reporterId={currentUserId}
          reportedUserId={ownerId}
          contentType={contentType}
          contentId={contentId}
          contentSnippet={contentSnippet}
        />
      )}

      {onDelete && (
        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir conteúdo?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
