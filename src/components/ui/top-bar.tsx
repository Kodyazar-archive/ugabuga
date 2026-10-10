import { useState } from 'react';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Camera,
  Check,
  Dices,
  FileDown,
  FlaskConical,
  Library,
  Link2,
  Maximize,
  Orbit,
  Redo2,
  RotateCw,
  SlidersHorizontal,
  Tag,
  Undo2,
  Zap,
} from 'lucide-react';

import { exportXYZ, formulaSegments, molarMass, molecularFormula } from '@/lib/chemistry';
import { PRESETS } from '@/lib/molecule-library';
import { encodeMolecule } from '@/lib/share-link';
import { useMoleculeStore } from '@/store/molecule-store';

import type { Molecule } from '@/lib/chemistry';
import type { DisplayMode } from '@/store/molecule-store';

const DISPLAY_MODES: Array<{ id: DisplayMode; label: string }> = [
  { id: 'ball-stick', label: 'Ball & Stick' },
  { id: 'space-filling', label: 'Space Fill' },
  { id: 'wireframe', label: 'Wireframe' },
];

interface TopBarProps {
  onOpenLibrary: () => void;
}

function IconButton({
  active,
  disabled,
  label,
  onClick,
  className = '',
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-lg border transition-all duration-150 active:scale-95 disabled:opacity-30 ${
        active
          ? 'border-aqua/60 bg-aqua/15 text-aqua'
          : 'border-edge bg-panel/60 text-mist hover:border-aqua/40 hover:text-chalk'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function formulaAndMass(molecule: Molecule): { formula: ReturnType<typeof formulaSegments>; mass: number | null } {
  if (molecule.atoms.length === 0) return { formula: [], mass: null };
  return { formula: formulaSegments(molecularFormula(molecule)), mass: molarMass(molecule) };
}

/** Triggers a browser download for a text blob or data URL. */
function download(href: string, filename: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function SizeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wider text-mist">
        {label}
        <span className="text-chalk">{value.toFixed(2)}×</span>
      </span>
      <input
        type="range"
        min={0.4}
        max={1.8}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal-300"
      />
    </label>
  );
}

export function TopBar({ onOpenLibrary }: TopBarProps) {
  const atoms = useMoleculeStore((s) => s.atoms);
  const bonds = useMoleculeStore((s) => s.bonds);
  const displayMode = useMoleculeStore((s) => s.displayMode);
  const setDisplayMode = useMoleculeStore((s) => s.setDisplayMode);
  const showLabels = useMoleculeStore((s) => s.showLabels);
  const toggleLabels = useMoleculeStore((s) => s.toggleLabels);
  const autoRotate = useMoleculeStore((s) => s.autoRotate);
  const toggleAutoRotate = useMoleculeStore((s) => s.toggleAutoRotate);
  const vibrating = useMoleculeStore((s) => s.vibrating);
  const toggleVibrating = useMoleculeStore((s) => s.toggleVibrating);
  const showDipole = useMoleculeStore((s) => s.showDipole);
  const toggleDipole = useMoleculeStore((s) => s.toggleDipole);
  const atomScale = useMoleculeStore((s) => s.atomScale);
  const setAtomScale = useMoleculeStore((s) => s.setAtomScale);
  const bondScale = useMoleculeStore((s) => s.bondScale);
  const setBondScale = useMoleculeStore((s) => s.setBondScale);
  const undo = useMoleculeStore((s) => s.undo);
  const redo = useMoleculeStore((s) => s.redo);
  const historyIndex = useMoleculeStore((s) => s.historyIndex);
  const historyLength = useMoleculeStore((s) => s.history.length);
  const activePresetId = useMoleculeStore((s) => s.activePresetId);
  const loadPreset = useMoleculeStore((s) => s.loadPreset);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { formula, mass } = formulaAndMass({ atoms, bonds });

  const surprise = () => {
    const pool = PRESETS.map((p) => p.id).filter((id) => id !== activePresetId);
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? PRESETS[0].id;
    loadPreset(pick);
  };

  const exportXyzFile = () => {
    const blob = new Blob([exportXYZ({ atoms, bonds })], { type: 'chemical/x-xyz' });
    const url = URL.createObjectURL(blob);
    download(url, `${molecularFormula({ atoms, bonds }) || 'molecule'}.xyz`);
    URL.revokeObjectURL(url);
  };

  const snapshotPng = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    try {
      download(canvas.toDataURL('image/png'), `${molecularFormula({ atoms, bonds }) || 'molecule'}.png`);
    } catch {
      // Canvas unreadable (GPU buffer lost) — stay silent, scene keeps running.
    }
  };

  const toggleFullscreen = () => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen unavailable (iframe/permissions) — ignore.
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#m=${encodeMolecule({ atoms, bonds })}`;
    try {
      void navigator.clipboard?.writeText(url);
    } catch {
      // Clipboard blocked — the link is still valid if typed out.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="glass pointer-events-auto absolute inset-x-0 top-0 z-20 flex items-center gap-3 border-x-0 border-t-0 px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="grid size-9 place-items-center rounded-xl bg-aqua/15 text-aqua">
          <Orbit size={19} />
        </div>
        <div className="leading-tight">
          <h1 className="font-display text-[15px] font-bold tracking-wide text-chalk">
            MOLECULAR<span className="text-aqua">STUDIO</span>
          </h1>
          <p className="font-mono text-[10px] text-mist">3D modeling platform</p>
        </div>
      </div>

      <div className="mx-2 hidden h-8 w-px bg-edge sm:block" />

      <div className="hidden min-w-0 items-baseline gap-3 sm:flex">
        <span className="flex items-center gap-1.5 font-mono text-sm text-chalk">
          <FlaskConical size={14} className="shrink-0 text-aqua" aria-hidden />
          {formula.map((seg, i) => (
            <span key={`${seg.text}-${i}`}>
              {seg.text}
              {seg.sub ? <sub className="text-[0.7em] text-mist">{seg.sub}</sub> : null}
            </span>
          ))}
          {formula.length === 0 ? <em className="text-mist">empty</em> : null}
        </span>
        {mass !== null ? <span className="shrink-0 font-mono text-xs text-mist">{mass.toFixed(2)} g/mol</span> : null}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <IconButton label="Undo (Ctrl+Z)" disabled={historyIndex <= 0} onClick={undo}>
          <Undo2 size={16} />
        </IconButton>
        <IconButton label="Redo (Ctrl+Shift+Z)" disabled={historyIndex >= historyLength - 1} onClick={redo}>
          <Redo2 size={16} />
        </IconButton>
        <IconButton label="Atom labels" active={showLabels} onClick={toggleLabels}>
          <Tag size={16} />
        </IconButton>
        <IconButton label="Auto rotate" active={autoRotate} onClick={toggleAutoRotate}>
          <RotateCw size={16} />
        </IconButton>
        <IconButton label="Thermal vibration" active={vibrating} onClick={toggleVibrating}>
          <Activity size={16} />
        </IconButton>
        <IconButton label="Dipole arrow" active={showDipole} onClick={toggleDipole}>
          <Zap size={16} />
        </IconButton>
        <IconButton label="Surprise me — random molecule" onClick={surprise}>
          <Dices size={16} />
        </IconButton>
        <span className="hidden sm:contents">
          <IconButton label="Export XYZ file" onClick={exportXyzFile}>
            <FileDown size={16} />
          </IconButton>
          <IconButton label="Snapshot PNG" onClick={snapshotPng}>
            <Camera size={16} />
          </IconButton>
          <div className="relative">
            <IconButton label="View settings" active={settingsOpen} onClick={() => setSettingsOpen((o) => !o)}>
              <SlidersHorizontal size={16} />
            </IconButton>
            {settingsOpen ? (
              <div className="glass absolute right-0 top-11 z-30 w-56 space-y-3 rounded-xl p-3.5">
                <SizeSlider label="Atom size" value={atomScale} onChange={setAtomScale} />
                <SizeSlider label="Bond thickness" value={bondScale} onChange={setBondScale} />
              </div>
            ) : null}
          </div>
          <IconButton label="Fullscreen" onClick={toggleFullscreen}>
            <Maximize size={16} />
          </IconButton>
          <IconButton label={copied ? 'Link copied!' : 'Copy share link'} active={copied} onClick={copyShareLink}>
            {copied ? <Check size={16} /> : <Link2 size={16} />}
          </IconButton>
        </span>

        <div className="mx-1 hidden h-8 w-px bg-edge md:block" />

        <div className="hidden items-center gap-0.5 rounded-lg border border-edge bg-panel/60 p-0.5 md:flex">
          {DISPLAY_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setDisplayMode(mode.id)}
              className={`relative rounded-md px-2.5 py-1.5 font-mono text-[10px] transition-colors ${
                displayMode === mode.id ? 'text-void' : 'text-mist hover:text-chalk'
              }`}
            >
              {displayMode === mode.id ? (
                <motion.span
                  layoutId="display-mode-pill"
                  className="absolute inset-0 rounded-md bg-aqua"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              ) : null}
              <span className="relative">{mode.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenLibrary}
          className="flex items-center gap-1.5 rounded-lg bg-aqua px-3 py-2 font-mono text-xs font-semibold text-void transition-transform duration-150 hover:bg-aqua/85 active:scale-95"
        >
          <Library size={15} />
          <span className="hidden sm:inline">Library</span>
        </button>
      </div>
    </header>
  );
}
