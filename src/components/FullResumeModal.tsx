import { Printer, RotateCcw, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ResumeProfile } from '../types/resume';

interface FullResumeModalProps {
  open: boolean;
  initialTab: 'view' | 'edit';
  profile: ResumeProfile;
  onClose: () => void;
  onSaveProfile: (next: ResumeProfile) => void;
  onResetProfile: () => void;
}

type RoleFocus = 'unified' | 'sre' | 'devops' | 'devsecops';

const FOCUS_HEADLINES: Record<RoleFocus, { label: string; headline: string }> =
  {
    unified: {
      label: 'All-in-One',
      headline: '',
    },
    sre: {
      label: 'SRE / Platform',
      headline:
        'SRE / Platform Engineer · Kubernetes, Observability, Secrets Management & Incident Response',
    },
    devops: {
      label: 'DevOps & IaC',
      headline:
        'DevOps Engineer · CI/CD, Kubernetes, Terraform, Observability & Linux',
    },
    devsecops: {
      label: 'DevSecOps',
      headline:
        'DevOps & DevSecOps Engineer · Kubernetes, GitLab CI, Vault, Gitleaks & DefectDojo',
    },
  };

export function FullResumeModal({
  open,
  initialTab,
  profile,
  onClose,
  onSaveProfile,
  onResetProfile,
}: FullResumeModalProps) {
  const [tab, setTab] = useState<'view' | 'edit'>(initialTab);
  const [focus, setFocus] = useState<RoleFocus>('unified');
  const [draft, setDraft] = useState<ResumeProfile>(profile);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setDraft(profile);
      setSavedNotice(false);
    }
  }, [open, initialTab, profile]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    onSaveProfile(draft);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2000);
    setTab('view');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full Resume Sheet"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 md:p-8 bg-black/75 print-only-sheet"
    >
      <div className="w-full max-w-4xl max-h-[90vh] rounded-xl border border-white/15 bg-[#0e121a] text-slate-100 shadow-2xl flex flex-col overflow-hidden print-only-sheet">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0 bg-[#121722]">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-black/35 border border-white/10">
            <button
              type="button"
              onClick={() => setTab('view')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'view'
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Resume Sheet
            </button>
            <button
              type="button"
              onClick={() => setTab('edit')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'edit'
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Customize My Resume
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {savedNotice && (
              <span className="text-xs text-emerald-400 font-medium">
                Updated 3D scene & saved
              </span>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-slate-950 hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close resume modal"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto dossier-scroll p-6 md:p-10 print-only-sheet">
          {tab === 'view' ? (
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Role Focus Filter (hidden when printing) */}
              <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                <span className="text-xs text-slate-400">
                  Role Focus View
                </span>
                <div
                  role="group"
                  aria-label="Role focus view"
                  className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-black/35 border border-white/10"
                >
                  {(Object.keys(FOCUS_HEADLINES) as RoleFocus[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFocus(key)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        focus === key
                          ? 'bg-amber-400 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {FOCUS_HEADLINES[key].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Header */}
              <header className="pb-6 border-b border-white/15 print:border-slate-300">
                <h1 className="font-display text-3xl font-bold tracking-tight text-white print:text-slate-900">
                  {profile.name}
                </h1>
                <p className="text-base font-medium text-amber-400 print:text-slate-700 mt-1">
                  {FOCUS_HEADLINES[focus].headline || profile.headline}
                </p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 print:text-slate-600 mt-3 font-mono-tabular">
                  <span>{profile.email}</span>
                  {profile.phone && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{profile.phone}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{profile.linkedin}</span>
                  <span aria-hidden="true">·</span>
                  <span>{profile.yearsExperience}</span>
                </div>
                <p className="text-sm text-slate-300 print:text-slate-800 leading-relaxed mt-4">
                  {profile.bio}
                </p>
              </header>

              {/* Experience */}
              <section className="space-y-4">
                <h2 className="font-display text-sm font-semibold tracking-wide text-slate-200 print:text-slate-900 border-b border-white/10 print:border-slate-200 pb-2">
                  01. Professional Experience
                </h2>
                <div className="space-y-5">
                  {profile.experience.map((exp) => (
                    <div key={exp.id} className="space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-semibold text-sm text-white print:text-slate-900">
                          {exp.role}{' '}
                          <span className="font-normal text-slate-400 print:text-slate-600">
                            — {exp.company}
                          </span>
                        </h3>
                        <span className="font-mono-tabular text-xs text-amber-400 print:text-slate-700">
                          {exp.period}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 print:text-slate-600">
                        {exp.location} · {exp.impactMetric}
                      </div>
                      <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                        {exp.summary}
                      </p>
                      <ul className="space-y-1 text-xs text-slate-300 print:text-slate-700 pt-0.5">
                        {exp.highlights.map((h, i) => (
                          <li key={i} className="flex gap-2">
                            <span aria-hidden="true">—</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Platform Systems */}
              <section className="space-y-4">
                <h2 className="font-display text-sm font-semibold tracking-wide text-slate-200 print:text-slate-900 border-b border-white/10 print:border-slate-200 pb-2">
                  02. Platform Systems & Production Initiatives
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3.5 rounded-lg border border-white/10 print:border-slate-200 bg-white/[0.02] space-y-1.5"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-semibold text-xs text-white print:text-slate-900">
                          {proj.name}
                        </h3>
                        <span className="font-mono-tabular text-[11px] text-slate-400 shrink-0">
                          {proj.year}
                        </span>
                      </div>
                      <div className="font-mono-tabular text-[11px] text-amber-400 print:text-slate-700">
                        {proj.metric}
                      </div>
                      <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                        {proj.description}
                      </p>
                      <div className="font-mono-tabular text-[11px] text-slate-400 pt-1">
                        {proj.stack}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Skills & Education */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-3">
                  <h2 className="font-display text-sm font-semibold tracking-wide text-slate-200 print:text-slate-900 border-b border-white/10 print:border-slate-200 pb-2">
                    03. Technical Competencies
                  </h2>
                  <div className="space-y-3">
                    {profile.skills.map((group) => (
                      <div key={group.id}>
                        <div className="text-xs font-semibold text-white print:text-slate-900">
                          {group.domain}{' '}
                          <span className="font-mono-tabular font-normal text-slate-400">
                            · {group.proficiency}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 print:text-slate-700 mt-1">
                          {group.items.join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <h2 className="font-display text-sm font-semibold tracking-wide text-slate-200 print:text-slate-900 border-b border-white/10 print:border-slate-200 pb-2">
                    04. Education & Workshops
                  </h2>
                  <div className="space-y-3">
                    {profile.education.map((edu) => (
                      <div key={edu.id}>
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="text-xs font-semibold text-white print:text-slate-900">
                            {edu.degree}
                          </div>
                          <div className="font-mono-tabular text-[11px] text-amber-400 print:text-slate-600 shrink-0">
                            {edu.period}
                          </div>
                        </div>
                        <div className="text-xs text-slate-300 print:text-slate-700">
                          {edu.institution}
                        </div>
                        <div className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                          {edu.honors}
                        </div>
                      </div>
                    ))}

                    {profile.workshops.length > 0 && (
                      <div className="pt-2 border-t border-white/10 print:border-slate-200 space-y-1">
                        <div className="text-xs font-semibold text-white print:text-slate-900">
                          Workshops & Training
                        </div>
                        <p className="text-xs text-slate-300 print:text-slate-700">
                          {profile.workshops.join(' · ')}
                        </p>
                      </div>
                    )}

                    {profile.languages.length > 0 && (
                      <div className="text-xs text-slate-400 print:text-slate-700">
                        Languages: {profile.languages.join(' · ')}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">
                    Personalize Your 3D Resume
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Updates the 3D nameplate plaque, workstation screens, and
                    folio cover immediately.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onResetProfile}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/15 text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reset Default</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Save & Update 3D</span>
                  </button>
                </div>
              </div>

              {/* Identity Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1.5 text-xs">
                  <span className="text-slate-300 font-medium">Full Name</span>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="text-slate-300 font-medium">
                    Title / Headline
                  </span>
                  <input
                    type="text"
                    value={draft.headline}
                    onChange={(e) =>
                      setDraft({ ...draft, headline: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="text-slate-300 font-medium">Location</span>
                  <input
                    type="text"
                    value={draft.location}
                    onChange={(e) =>
                      setDraft({ ...draft, location: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="text-slate-300 font-medium">
                    Years of Experience
                  </span>
                  <input
                    type="text"
                    value={draft.yearsExperience}
                    onChange={(e) =>
                      setDraft({ ...draft, yearsExperience: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="text-slate-300 font-medium">Email</span>
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) =>
                      setDraft({ ...draft, email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="text-slate-300 font-medium">
                    Phone (clear to hide publicly)
                  </span>
                  <input
                    type="text"
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft({ ...draft, phone: e.target.value })
                    }
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="text-slate-300 font-medium">
                    LinkedIn / Website
                  </span>
                  <input
                    type="text"
                    value={draft.linkedin}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        linkedin: e.target.value,
                        website: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </label>
              </div>

              <label className="block space-y-1.5 text-xs">
                <span className="text-slate-300 font-medium">
                  Executive Summary
                </span>
                <textarea
                  rows={3}
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </label>

              {/* Experience quick editor */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h3 className="font-display text-sm font-semibold text-slate-200">
                  Experience Roles
                </h3>
                <div className="space-y-3">
                  {draft.experience.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-lg border border-white/10 bg-black/25 grid grid-cols-1 md:grid-cols-3 gap-3"
                    >
                      <input
                        type="text"
                        aria-label="Role title"
                        value={exp.role}
                        onChange={(e) => {
                          const next = [...draft.experience];
                          next[idx] = { ...exp, role: e.target.value };
                          setDraft({ ...draft, experience: next });
                        }}
                        placeholder="Role"
                        className="px-2.5 py-1.5 rounded bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        aria-label="Company"
                        value={exp.company}
                        onChange={(e) => {
                          const next = [...draft.experience];
                          next[idx] = { ...exp, company: e.target.value };
                          setDraft({ ...draft, experience: next });
                        }}
                        placeholder="Company"
                        className="px-2.5 py-1.5 rounded bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        aria-label="Period"
                        value={exp.period}
                        onChange={(e) => {
                          const next = [...draft.experience];
                          next[idx] = { ...exp, period: e.target.value };
                          setDraft({ ...draft, experience: next });
                        }}
                        placeholder="Period"
                        className="px-2.5 py-1.5 rounded bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <textarea
                        rows={2}
                        aria-label="Role summary"
                        value={exp.summary}
                        onChange={(e) => {
                          const next = [...draft.experience];
                          next[idx] = { ...exp, summary: e.target.value };
                          setDraft({ ...draft, experience: next });
                        }}
                        className="md:col-span-3 px-2.5 py-1.5 rounded bg-black/40 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects quick editor */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h3 className="font-display text-sm font-semibold text-slate-200">
                  Featured Projects
                </h3>
                <div className="space-y-3">
                  {draft.projects.map((proj, idx) => (
                    <div
                      key={proj.id}
                      className="p-3.5 rounded-lg border border-white/10 bg-black/25 grid grid-cols-1 md:grid-cols-3 gap-3"
                    >
                      <input
                        type="text"
                        aria-label="Project name"
                        value={proj.name}
                        onChange={(e) => {
                          const next = [...draft.projects];
                          next[idx] = { ...proj, name: e.target.value };
                          setDraft({ ...draft, projects: next });
                        }}
                        className="px-2.5 py-1.5 rounded bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        aria-label="Project metric"
                        value={proj.metric}
                        onChange={(e) => {
                          const next = [...draft.projects];
                          next[idx] = { ...proj, metric: e.target.value };
                          setDraft({ ...draft, projects: next });
                        }}
                        className="px-2.5 py-1.5 rounded bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        aria-label="Project stack"
                        value={proj.stack}
                        onChange={(e) => {
                          const next = [...draft.projects];
                          next[idx] = { ...proj, stack: e.target.value };
                          setDraft({ ...draft, projects: next });
                        }}
                        className="px-2.5 py-1.5 rounded bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
