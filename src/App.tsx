import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

import { HintBar } from '@/components/ui/hint-bar';
import { InfoPanel } from '@/components/ui/info-panel';
import { LibraryDialog } from '@/components/ui/library-dialog';
import { ToolRail } from '@/components/ui/tool-rail';
import { TopBar } from '@/components/ui/top-bar';
import { decodeMolecule } from '@/lib/share-link';
import { useMoleculeStore } from '@/store/molecule-store';

// Lazily imported so the 3D bundle does not block first paint.
const MoleculeCanvas = lazy(() => import('@/components/scene/molecule-canvas'));

const KEY_TOOLS: Record<string, 'select' | 'add' | 'bond' | 'delete'> = {
  v: 'select',
  a: 'add',
  b: 'bond',
  d: 'delete',
};

export default function App() {
  const [libraryOpen, setLibraryOpen] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    const store = useMoleculeStore.getState();

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) store.redo();
      else store.undo();
      return;
    }
    if (event.key === 'Escape') {
      setLibraryOpen(false);
      store.cancelBondRequest();
      store.select(null);
      return;
    }
    const tool = KEY_TOOLS[event.key.toLowerCase()];
    if (tool) store.setTool(tool);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Shared `#m=` links restore the exact molecule on load.
  useEffect(() => {
    const match = window.location.hash.match(/#m=([A-Za-z0-9\-_]+)/);
    if (!match) return;
    const molecule = decodeMolecule(match[1]);
    if (molecule && molecule.atoms.length > 0) {
      useMoleculeStore.getState().loadMolecule(molecule);
    }
  }, []);

  return (
    <main className="relative size-full overflow-hidden bg-void">
      <Suspense
        fallback={
          <div className="grid size-full place-items-center">
            <div className="flex flex-col items-center gap-3">
              <span className="size-10 animate-spin rounded-full border-2 border-edge border-t-aqua" />
              <p className="font-mono text-xs text-mist">Initializing renderer…</p>
            </div>
          </div>
        }
      >
        <MoleculeCanvas />
      </Suspense>

      <div className="pointer-events-none absolute inset-0">
        <TopBar onOpenLibrary={() => setLibraryOpen(true)} />
        <ToolRail />
        <InfoPanel />
        <HintBar />
        <LibraryDialog open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      </div>
    </main>
  );
}
