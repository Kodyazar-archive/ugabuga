import { AnimatePresence, motion } from 'motion/react';
import { Link2, X } from 'lucide-react';

import { useMoleculeStore } from '@/store/molecule-store';

import type { Tool } from '@/store/molecule-store';

const TOOL_HINTS: Record<Tool, string> = {
  select: 'Drag atoms to reposition · scroll to zoom · right-drag to pan · click to inspect',
  add: 'Click an atom to grow a bonded neighbor, or click empty space to place a free atom',
  bond: 'Click two atoms in sequence to bond them',
  delete: 'Click an atom or bond to remove it',
};

export function HintBar() {
  const tool = useMoleculeStore((s) => s.tool);
  const bondPendingId = useMoleculeStore((s) => s.bondPendingId);
  const cancelBondRequest = useMoleculeStore((s) => s.cancelBondRequest);
  const atoms = useMoleculeStore((s) => s.atoms);

  const pending = bondPendingId ? atoms.find((a) => a.id === bondPendingId) : undefined;
  const message =
    tool === 'bond' && pending
      ? `Bonding from ${pending.element} — click a second atom to complete the bond`
      : TOOL_HINTS[tool];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className={`glass pointer-events-auto flex max-w-full items-center gap-2 rounded-full px-4 py-2 ${
            pending ? 'border-amber/50' : ''
          }`}
        >
          {pending ? (
            <Link2 size={14} className="shrink-0 text-amber" />
          ) : (
            <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-aqua" />
          )}
          <span className="truncate font-mono text-[11px] text-mist">{message}</span>
          {pending ? (
            <button
              type="button"
              onClick={cancelBondRequest}
              aria-label="Cancel bond"
              className="grid size-5 shrink-0 place-items-center rounded-full text-mist transition-colors hover:text-rose"
            >
              <X size={12} />
            </button>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
