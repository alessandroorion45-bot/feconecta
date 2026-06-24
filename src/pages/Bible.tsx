import Header from "@/components/Header";
import DarkModeToggle from "@/components/DarkModeToggle";
import { BibleReader } from "@/components/bible/BibleReader";

const Bible = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--theme-background)' }}>
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-4 flex-wrap">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent leading-tight pt-1">
              Bíblia Sagrada
            </h1>
            <DarkModeToggle />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Medite na Palavra de Deus
          </p>
        </div>

        <BibleReader />
      </main>
    </div>
  );
};

export default Bible;
