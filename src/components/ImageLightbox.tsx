import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  className?: string;
}

const ImageLightbox = ({ src, alt = "", className = "" }: ImageLightboxProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`cursor-pointer transition-transform hover:scale-[1.02] ${className}`}
        onClick={() => setIsOpen(true)}
      />
      {/* DialogContent já injeta seu próprio botão de fechar — só estiliza
          ele aqui (bolinha escura, X branco) em vez de renderizar um
          segundo por cima, que era o botão duplicado reportado. */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent [&>button]:top-2 [&>button]:right-2 [&>button]:z-10 [&>button]:bg-black/50 [&>button]:hover:bg-black/70 [&>button]:text-white [&>button]:rounded-full [&>button]:opacity-100 [&>button]:h-9 [&>button]:w-9 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button_svg]:h-5 [&>button_svg]:w-5">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageLightbox;
