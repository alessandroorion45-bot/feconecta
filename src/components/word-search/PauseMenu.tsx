import { memo } from 'react';
import { Play, Save, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
  onSave: () => void;
}

const PauseMenu = memo(({ open, onResume, onSave }: PauseMenuProps) => {
  if (!open) return null;

  return (
    <div className="pv-pause-overlay" onClick={onResume}>
      <div className="pv-pause-menu" onClick={e => e.stopPropagation()}>
        <div className="pv-pause-icon">⏸</div>
        <h2 className="pv-pause-title">Jogo Pausado</h2>

        <button onClick={onResume} className="pv-pause-btn pv-pause-btn-primary">
          <Play className="h-5 w-5" />
          <span>Continuar</span>
        </button>

        <button onClick={() => { onSave(); }} className="pv-pause-btn">
          <Save className="h-5 w-5" />
          <span>Salvar Progresso</span>
        </button>

        <Link to="/" className="pv-pause-btn pv-pause-btn-danger">
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </Link>
      </div>
    </div>
  );
});

PauseMenu.displayName = 'PauseMenu';

export default PauseMenu;
