import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ChapterId, ResumeProfile } from '../types/resume';

interface ExhibitDossierDrawerProps {
  open: boolean;
  chapter: ChapterId;
  profile: ResumeProfile;
  onClose: () => void;
  onSelectChapter: (chapter: ChapterId) => void;
  onOpenFullResume: () => void;
}

const CHAPTER_ORDER: ChapterId[] = [
  'overview',
  'experience',
  'projects',
  'skills',
  'credentials',
];

const CHAPTER_LABELS: Record<ChapterId, string> = {
  overview: '01. Profile & Philosophy',
  experience: '02. Experience Chronology',
  projects: '03. Platform & DevSecOps Systems',
  skills: '04. Technical Stack',
  credentials: '05. Education, Workshops & Contact',
};

export function ExhibitDossierDrawer({
  open,
  chapter,
  profile,
  onClose,
  onSelectChapter,
  onOpenFullResume,
}: ExhibitDossierDrawerProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const idx = CHAPTER_ORDER.indexOf(chapter);
  const prevChapter =
    CHAPTER_ORDER[(idx - 1 + CHAPTER_ORDER.length) % CHAPTER_ORDER.length];
  const nextChapter = CHAPTER_ORDER[(idx + 1) % CHAPTER_ORDER.length];

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 1800);
    } catch {
      // Clipboard blocked in restricted contexts
    }
  };

  return (
    <aside
      aria-label="Exhibit Dossier"
      aria-hidden={!open}
      className={`no-print fixed top-16 right-4 md:right-6 bottom-36 z-25 w-[min(460px,calc(100vw-2rem))] rounded-xl border border-white/12 bg-[#0d1118]/95 shadow-2xl flex flex-col transition-all duration-200 ease-out ${
        open
          ? 'opacity-100 translate-x-0 pointer-events-auto'
          : 'opacity-0 translate-x-6 pointer-events-none'
      }`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <p className="font-mono-tabular text-[11px] text-amber-400 tracking-wide">
            {CHAPTER_LABELS[chapter]}
          </p>
          <h3 className="font-display text-lg font-semibold text-white truncate mt-0.5">
            {profile.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dossier"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Scrollable Chapter Content */}
      <div className="flex-1 overflow-y-auto dossier-scroll px-5 py-5 space-y-6">
        {chapter === 'overview' && (
          <>
            <div className="space-y-3">
              <h4 className="font-display text-xl font-semibold text-slate-100 leading-snug text-balance">
                {profile.headline}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{profile.location}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {profile.yearsExperience}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300">{profile.availability}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {profile.bio}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
              {profile.keyMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="p-3 rounded-lg border border-white/10 bg-white/[0.03]"
                >
                  <div className="font-mono-tabular text-base font-semibold text-amber-400">
                    {metric.value}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>

            {(profile.softSkills.length > 0 || profile.languages.length > 0) && (
              <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-slate-300">
                {profile.softSkills.length > 0 && (
                  <p>
                    <span className="text-slate-400">Soft Skills: </span>
                    {profile.softSkills.join(' · ')}
                  </p>
                )}
                {profile.languages.length > 0 && (
                  <p>
                    <span className="text-slate-400">Languages: </span>
                    {profile.languages.join(' · ')}
                  </p>
                )}
                {profile.interests.length > 0 && (
                  <p>
                    <span className="text-slate-400">Interests: </span>
                    {profile.interests.join(' · ')}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {chapter === 'experience' && (
          <div className="space-y-5">
            {profile.experience.map((item, index) => (
              <article
                key={item.id}
                className={
                  index < profile.experience.length - 1
                    ? 'pb-5 border-b border-white/10'
                    : ''
                }
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-display text-base font-semibold text-white">
                    {item.role}
                  </h4>
                  <span className="font-mono-tabular text-xs text-amber-400">
                    {item.period}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="text-slate-200 font-medium">
                    {item.company}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.location}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular text-sky-300">
                    {item.impactMetric}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mt-2.5">
                  {item.summary}
                </p>
                <ul className="mt-2.5 space-y-1.5 text-xs text-slate-300 leading-relaxed">
                  {item.highlights.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="text-amber-400 shrink-0"
                      >
                        —
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}

        {chapter === 'projects' && (
          <div className="space-y-5">
            {profile.projects.map((proj, index) => (
              <article
                key={proj.id}
                className={
                  index < profile.projects.length - 1
                    ? 'pb-5 border-b border-white/10'
                    : ''
                }
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="font-display text-base font-semibold text-white">
                    {proj.name}
                  </h4>
                  <span className="font-mono-tabular text-xs text-slate-400">
                    {proj.year}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{proj.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular text-amber-400">
                    {proj.metric}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mt-2.5">
                  {proj.description}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                  <span className="font-mono-tabular text-[11px] text-slate-400">
                    {proj.stack}
                  </span>
                  {proj.linkUrl && (
                    <a
                      href={proj.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <span>{proj.linkLabel || 'View'}</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {chapter === 'skills' && (
          <div className="space-y-5">
            {profile.skills.map((group, index) => (
              <section
                key={group.id}
                className={
                  index < profile.skills.length - 1
                    ? 'pb-5 border-b border-white/10'
                    : ''
                }
              >
                <div className="flex items-baseline justify-between gap-2 mb-2.5">
                  <h4 className="font-display text-base font-semibold text-white">
                    {group.domain}
                  </h4>
                  <span className="font-mono-tabular text-xs text-amber-400">
                    {group.proficiency}
                  </span>
                </div>
                <ul className="space-y-1.5 text-sm text-slate-300">
                  {group.items.map((skill) => (
                    <li
                      key={skill}
                      className="flex items-center justify-between py-1 border-b border-white/5 last:border-b-0"
                    >
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {chapter === 'credentials' && (
          <div className="space-y-6">
            <section className="space-y-4">
              <h4 className="font-display text-sm font-semibold text-slate-200">
                Education
              </h4>
              {profile.education.map((edu, index) => (
                <div
                  key={edu.id}
                  className={
                    index < profile.education.length - 1
                      ? 'pb-4 border-b border-white/10'
                      : ''
                  }
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h5 className="font-medium text-sm text-white">
                      {edu.degree}
                    </h5>
                    <span className="font-mono-tabular text-xs text-amber-400 shrink-0">
                      {edu.period}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {edu.institution}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{edu.honors}</p>
                </div>
              ))}
            </section>

            {profile.workshops.length > 0 && (
              <section className="pt-4 border-t border-white/10 space-y-2.5">
                <h4 className="font-display text-sm font-semibold text-slate-200">
                  Certifications & Workshops
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {profile.workshops.map((w) => (
                    <li key={w} className="flex gap-2">
                      <span aria-hidden="true" className="text-amber-400">
                        —
                      </span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="pt-4 border-t border-white/10 space-y-3">
              <h4 className="font-display text-sm font-semibold text-slate-200">
                Direct Contact
              </h4>
              <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-white/10 bg-white/[0.03]">
                <a
                  href={`mailto:${profile.email}`}
                  className="font-mono-tabular text-xs text-amber-300 hover:underline truncate"
                >
                  {profile.email}
                </a>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 pt-1 font-mono-tabular">
                {profile.phone && (
                  <>
                    <span>{profile.phone}</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span>{profile.linkedin}</span>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelectChapter(prevChapter)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectChapter(nextChapter)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenFullResume}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 transition-colors cursor-pointer whitespace-nowrap"
        >
          Print / Full CV
        </button>
      </div>
    </aside>
  );
}
