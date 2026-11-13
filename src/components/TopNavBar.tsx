import { ChapterId } from '../types/resume';

interface TopNavBarProps {
  candidateName: string;
  activeChapter: ChapterId;
  onScrollToSection: (chapter: ChapterId) => void;
  onOpenFullResume: () => void;
}

const NAV_ITEMS: { id: ChapterId; label: string }[] = [
  { id: 'cloud', label: 'Cloud & K8s' },
  { id: 'cicd', label: 'CI/CD' },
  { id: 'observability', label: 'Observability' },
  { id: 'security', label: 'Security' },
  { id: 'career', label: 'Career' },
];

export function TopNavBar({
  candidateName,
  activeChapter,
  onScrollToSection,
  onOpenFullResume,
}: TopNavBarProps) {
  return (
    <header className="no-print fixed top-0 left-0 right-0 z-30 h-14 px-5 md:px-8 flex items-center justify-between gap-8 bg-[#0b0e14]/94 border-b border-white/10">
      {/* Zone 1: Single text element wordmark */}
      <button
        type="button"
        onClick={() => onScrollToSection('overview')}
        className="font-display text-lg font-semibold tracking-tight text-slate-100 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-4 rounded"
      >
        {candidateName}
      </button>

      {/* Zone 2: 5 concise single-line text links */}
      <nav
        aria-label="Core Skills Sections"
        className="hidden md:flex items-center gap-6"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeChapter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onScrollToSection(item.id)}
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
