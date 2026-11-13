import { CameraViewId, ChapterId } from '../types/resume';

interface TopNavBarProps {
  candidateName: string;
  activeChapter: ChapterId;
  activeView: CameraViewId;
  onNavigateChapter: (chapter: ChapterId, openDossier?: boolean) => void;
  onOpenFullResume: () => void;
}

const NAV_ITEMS: { id: ChapterId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Systems' },
  { id: 'skills', label: 'Skills' },
  { id: 'credentials', label: 'Credentials' },
];

export function TopNavBar({
  candidateName,
  activeChapter,
  activeView,
  onNavigateChapter,
  onOpenFullResume,
}: TopNavBarProps) {
  return (
    <header className="no-print fixed top-0 left-0 right-0 z-20 h-14 px-5 md:px-8 flex items-center justify-between gap-8 bg-[#0b0e14]/92 border-b border-white/10">
      {/* Zone 1: Single text element wordmark */}
      <button
        type="button"
        onClick={() => onNavigateChapter('overview', false)}
        className="font-display text-lg font-semibold tracking-tight text-slate-100 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-4 rounded"
      >
        {candidateName}
      </button>

      {/* Zone 2: 5 concise single-line text links */}
      <nav
        aria-label="Resume Sections"
        className="hidden md:flex items-center gap-6"
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            activeView !== 'gallery' && activeChapter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigateChapter(item.id, true)}
              className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-4 rounded ${
                isActive
                  ? 'text-amber-400'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0 -bottom-[13px] h-[2px] bg-amber-400"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenFullResume}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-300 focus-visible:outline-offset-2"
        >
          Full Resume
        </button>
      </div>
    </header>
  );
}
