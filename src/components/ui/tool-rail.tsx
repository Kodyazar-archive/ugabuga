import { Eraser, Hand, Link2, Plus } from 'lucide-react';

import { elementOf, PALETTE_ELEMENTS } from '@/lib/element-data';
import { useMoleculeStore } from '@/store/molecule-store';

import type { Tool } from '@/store/molecule-store';

const TOOLS: Array<{ id: Tool; label: string; hint: string; Icon: typeof Hand }> = [
  { id: 'select', label: 'Select / Move', hint: 'V', Icon: Hand },
  { id: 'add', label: 'Add Atom', hint: 'A', Icon: Plus },
  { id: 'bond', label: 'Create Bond', hint: 'B', Icon: Link2 },
  { id: 'delete', label: 'Delete', hint: 'D', Icon: Eraser },
];

export function ToolRail() {
  const tool = useMoleculeStore((s) => s.tool);
  const setTool = useMoleculeStore((s) => s.setTool);
  const selectedElement = useMoleculeStore((s) => s.selectedElement);
  const setSelectedElement = useMoleculeStore((s) => s.setSelectedElement);

  return (
    <aside className="glass pointer-events-auto absolute left-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1 rounded-2xl p-1.5 sm:left-3">
      {TOOLS.map(({ id, label, hint, Icon }) => (
        <button
          key={id}
          type="button"
          title={`${label} (${hint})`}
          aria-label={label}
          aria-pressed={tool === id}
          onClick={() => setTool(id)}
          className={`grid size-10 place-items-center rounded-xl transition-all duration-150 active:scale-95 ${
            tool === id
              ? 'bg-aqua text-void shadow-[0_0_18px_rgba(69,224,208,0.35)]'
              : 'text-mist hover:bg-edge/60 hover:text-chalk'
          }`}
        >
          <Icon size={18} />
        </button>
      ))}

      <div className="my-1 h-px bg-edge" />

      <div className="flex max-h-[38vh] flex-col gap-1 overflow-y-auto scroll-thin pr-0.5">
        {PALETTE_ELEMENTS.map((sym) => {
          const el = elementOf(sym);
          const active = selectedElement === sym;
          return (
            <button
              key={sym}
              type="button"
              title={`${el.name} — Z ${el.atomicNumber}`}
              aria-label={el.name}
              aria-pressed={active}
              onClick={() => setSelectedElement(sym)}
              className={`grid size-10 place-items-center rounded-xl border font-display text-sm font-bold transition-all duration-150 active:scale-95 ${
                active
                  ? 'border-aqua bg-aqua/10 text-chalk shadow-[0_0_14px_rgba(69,224,208,0.25)]'
                  : 'border-edge/70 bg-panel/50 text-mist hover:border-aqua/40 hover:text-chalk'
              }`}
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: el.color }} aria-hidden />
              <span className="-mt-1 text-[11px] leading-none">{sym}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
