import { AnimatePresence, motion } from 'motion/react';
import { FlaskConical, X } from 'lucide-react';

import { PRESETS } from '@/lib/molecule-library';
import { useMoleculeStore } from '@/store/molecule-store';

interface LibraryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LibraryDialog({ open, onClose }: LibraryDialogProps) {
  const loadPreset = useMoleculeStore((s) => s.loadPreset);
  const activePresetId = useMoleculeStore((s) => s.activePresetId);
  const clearAll = useMoleculeStore((s) => s.clearAll);

  function choose(id: string) {
    loadPreset(id);
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-30 grid place-items-center bg-void/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Molecule library"
          >
            <div className="flex items-center justify-between border-b border-edge px-5 py-3.5">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.16em] text-chalk">
                <FlaskConical size={16} className="text-aqua" />
                Molecule Library
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearAll();
                    onClose();
                  }}
                  className="rounded-lg border border-edge bg-panel/60 px-3 py-1.5 font-mono text-[11px] text-mist transition-colors hover:border-rose/50 hover:text-rose active:scale-95"
                >
                  Empty scene
                </button>
                <button
                  type="button"
                  aria-label="Close library"
                  onClick={onClose}
                  className="grid size-8 place-items-center rounded-lg border border-edge bg-panel/60 text-mist transition-colors hover:text-chalk active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="grid max-h-[calc(85vh-4rem)] grid-cols-1 gap-2.5 overflow-y-auto p-4 scroll-thin sm:grid-cols-2 lg:grid-cols-3">
              {PRESETS.map((preset, i) => {
                const active = activePresetId === preset.id;
                return (
                  <motion.button
                    key={preset.id}
                    type="button"
                    onClick={() => choose(preset.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.2 }}
                    className={`group rounded-xl border p-3.5 text-left transition-all duration-150 active:scale-[0.98] ${
                      active
                        ? 'border-aqua/70 bg-aqua/10'
                        : 'border-edge bg-panel/50 hover:-translate-y-0.5 hover:border-aqua/40 hover:bg-panel'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-sm font-semibold text-chalk">{preset.name}</span>
                      <span className="shrink-0 font-mono text-[10px] text-aqua">{preset.coords.length} atoms</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-mist">{preset.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
