import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ThemeCenterModal } from "@/components/themes/ThemeCenterModal";

const DarkModeToggle = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsModalOpen(true)}
        title="Personalizar aparência"
        className="relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        <Palette className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
      </Button>

      <ThemeCenterModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};

export default DarkModeToggle;
