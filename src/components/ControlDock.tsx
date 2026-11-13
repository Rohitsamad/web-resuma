import {
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CameraViewId,
  ChapterId,
  MaterialFinish,
  ResumeProfile,
} from '../types/resume';

interface ControlDockProps {
  profile: ResumeProfile;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  activeChapter: ChapterId;
  activeView: CameraViewId;
  explode: number;
  finish: MaterialFinish;
  autoRotate: boolean;
  audioEnabled: boolean;
  onSelectView: (view: CameraViewId) => void;
  onOpenDossier: (chapter: ChapterId) => void;
  onOpenEditor: () => void;
  onChangeExplode: (value: number) => void;
  onChangeFinish: (finish: MaterialFinish) => void;
  onToggleAutoRotate: () => void;
  onToggleAudio: () => void;
}

const CAMERA_PRESETS: { id: CameraViewId; shortLabel: string; label: string }[] =
  [
    { id: 'gallery', shortLabel: 'All', label: 'Gallery Wide' },
    { id: 'overview', shortLabel: '01', label: 'Overview' },
    { id: 'experience', shortLabel: '02', label: 'Experience' },
    { id: 'projects', shortLabel: '03', label: 'Systems' },
    { id: 'skills', shortLabel: '04', label: 'Skills' },
    { id: 'credentials', shortLabel: '05', label: 'Credentials' },
  ];

const FINISH_OPTIONS: {
  id: MaterialFinish;
  label: string;
  swatchColor: string;
}[] = [
  { id: 'titanium', label: 'Titanium', swatchColor: '#9aa6b8' },
  { id: 'brass', label: 'Brass', swatchColor: '#d4a359' },
  { id: 'obsidian', label: 'Obsidian', swatchColor: '#38bdf8' },
];

function getChapterCaption(
  chapter: ChapterId,
  profile: ResumeProfile,
): { title: string; subtitle: string } {
  switch (chapter) {
    case 'overview':
      return {
        title: `01. ${profile.name}`,
        subtitle: `${profile.headline} · ${profile.yearsExperience}`,
      };
    case 'experience': {
      const latest = profile.experience[0];
      return {
        title: '02. Experience Chronology',
        subtitle: latest
          ? `${profile.experience.length} Roles · Latest: ${latest.role} at ${latest.company}`
          : 'Career timeline and production impact',
      };
    }
    case 'projects':
      return {
        title: '03. Platform & DevSecOps Systems',
        subtitle: `${profile.projects.length} Production Initiatives · Kubernetes, CI/CD, Observability & Vault`,
      };
    case 'skills': {
      const total = profile.skills.reduce((acc, g) => acc + g.items.length, 0);
      return {
        title: '04. Technical Stack',
        subtitle: `${profile.skills.length} Core Domains · ${total} Production Competencies`,
      };
    }
    case 'credentials':
      return {
        title: '05. Education, Workshops & Contact',
        subtitle: `${profile.education[0]?.institution ?? 'Education'} · ${profile.email}`,
      };
  }
}

export function ControlDock({
  profile,
  collapsed,
  onToggleCollapsed,
  activeChapter,
  activeView,
  explode,
  finish,
  autoRotate,
  audioEnabled,
  onSelectView,
  onOpenDossier,
  onOpenEditor,
  onChangeExplode,
  onChangeFinish,
  onToggleAutoRotate,
  onToggleAudio,
}: ControlDockProps) {
  const caption = getChapterCaption(activeChapter, profile);

  return (
    <div
      className="no-print fixed left-1/2 bottom-5 z-20 w-[min(940px,94vw)] transition-transform duration-300 ease-out"
      style={{
        transform: collapsed
          ? 'translate(-50%, calc(100% + 20px))'
          : 'translate(-50%, 0)',
      }}
    >
      {/* Top Edge Collapse / Expand Tab */}
      <div className="flex justify-center mb-1.5">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          title="Toggle controls (H)"
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-t-lg border border-white/15 bg-[#0e121a]/95 text-slate-200 hover:text-amber-300 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400 ${
            collapsed ? '-translate-y-12 rounded-b-lg shadow-lg' : ''
          }`}
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Hide Controls</span>
            </>
          )}
        </button>
      </div>

      {/* Main Solid-Surface Control Panel (Zero backdrop-filter over WebGL) */}
      <div className="rounded-xl border border-white/12 bg-[#0e121a]/95 shadow-2xl px-4 py-3 flex flex-col gap-2.5">
        {/* Row 1: Active Exhibit Summary + Dossier / Edit Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-sm font-semibold text-slate-100 truncate">
                {caption.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {caption.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenDossier(activeChapter)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Read Details</span>
            </button>
            <button
              type="button"
              onClick={onOpenEditor}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Edit Info</span>
            </button>
          </div>
        </div>

        {/* Row 2: Camera Presets, Explode Slider, Finish Swatches & Auto-Orbit */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Camera Exhibit Selector */}
          <div
            role="group"
            aria-label="Camera Exhibits"
            className="flex items-center gap-1 p-0.5 rounded-lg bg-black/35 border border-white/8"
          >
            {CAMERA_PRESETS.map((preset) => {
              const isActive = activeView === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectView(preset.id)}
                  title={preset.label}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="font-mono-tabular">{preset.shortLabel}</span>
                  <span className="hidden lg:inline ml-1.5">{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* Explode Slider + Finish Swatches + Auto-Orbit */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap shrink-0">
              <span>Explode</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={explode}
                onChange={(e) => onChangeExplode(parseFloat(e.target.value))}
                aria-label="Explode 3D assemblies"
                className="studio-range w-20 sm:w-24 cursor-pointer"
              />
              <span className="font-mono-tabular text-[11px] text-slate-400 w-8 text-right">
                {Math.round(explode * 100)}%
              </span>
            </label>

            <div
              role="group"
              aria-label="Material Finish"
              className="flex items-center gap-1.5"
            >
              {FINISH_OPTIONS.map((opt) => {
                const selected = finish === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeFinish(opt.id)}
                    aria-pressed={selected}
                    title={`Finish: ${opt.label}`}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${
                      selected
                        ? 'border-amber-400 bg-white/10 text-white font-medium'
                        : 'border-white/10 bg-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: opt.swatchColor }}
                    />
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onToggleAutoRotate}
              aria-pressed={autoRotate}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${
                autoRotate
                  ? 'border-amber-400/80 bg-amber-400/15 text-amber-300'
                  : 'border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Orbit</span>
            </button>

            <button
              type="button"
              onClick={onToggleAudio}
              aria-pressed={audioEnabled}
              aria-label={audioEnabled ? 'Mute ambient audio' : 'Unmute ambient audio'}
              title="Toggle ambient audio (M)"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${
                audioEnabled
                  ? 'border-amber-400/80 bg-amber-400/15 text-amber-300'
                  : 'border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {audioEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sound</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
