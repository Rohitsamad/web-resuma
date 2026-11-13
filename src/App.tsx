/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AmbientAudioEngine } from './audio/AmbientAudioEngine';
import { FullResumeModal } from './components/FullResumeModal';
import { SkillScrollSections } from './components/SkillScrollSections';
import { TopNavBar } from './components/TopNavBar';
import {
  clearSavedResumeProfile,
  loadResumeProfile,
  saveResumeProfile,
} from './data/defaultResume';
import { ResumeSceneManager } from './three/ResumeSceneManager';
import { ChapterId, ResumeProfile } from './types/resume';

const SECTION_ORDER: ChapterId[] = [
  'overview',
  'cloud',
  'cicd',
  'observability',
  'security',
  'career',
];

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneManagerRef = useRef<ResumeSceneManager | null>(null);
  const audioEngineRef = useRef<AmbientAudioEngine | null>(null);
  const sectionRefs = useRef<Partial<Record<ChapterId, HTMLElement | null>>>({});

  const [profile, setProfile] = useState<ResumeProfile>(() =>
    loadResumeProfile(),
  );
  const [activeChapter, setActiveChapter] = useState<ChapterId>('overview');
  const [hoveredExhibit, setHoveredExhibit] = useState<ChapterId | null>(null);
  const [modalState, setModalState] = useState<{
    open: boolean;
    tab: 'view' | 'edit';
  }>({ open: false, tab: 'view' });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  const registerSectionRef = useCallback(
    (id: ChapterId, el: HTMLElement | null) => {
      sectionRefs.current[id] = el;
    },
    [],
  );

  const scrollToSection = useCallback((chapter: ChapterId) => {
    const el = sectionRefs.current[chapter];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveChapter(chapter);
    sceneManagerRef.current?.setActiveChapter(chapter);
    sceneManagerRef.current?.pulseExhibit(chapter);
  }, []);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    let manager: ResumeSceneManager | null = null;
    try {
      manager = new ResumeSceneManager(container, profile, {
        onSelectExhibit: scrollToSection,
        onHoverExhibit: setHoveredExhibit,
        onContextLostChange: setContextLost,
      });
      sceneManagerRef.current = manager;
    } catch (err) {
      setWebglError(
        err instanceof Error ? err.message : 'WebGL initialization unavailable',
      );
    }

    const engine = new AmbientAudioEngine();
    audioEngineRef.current = engine;

    return () => {
      sceneManagerRef.current = null;
      manager?.dispose();
      audioEngineRef.current = null;
      engine.dispose();
    };
    // Mount scene once; profile updates flow through manager.updateResumeProfile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToSection]);

  // Synchronize page vertical scroll to 3D spline camera & chapter detection
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      sceneManagerRef.current?.setScrollProgress(progress);

      const midY = window.innerHeight * 0.48;
      let closestId: ChapterId = 'overview';
      let closestDist = Infinity;

      SECTION_ORDER.forEach((id) => {
        const el = sectionRefs.current[id];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height * 0.5;
        const dist = Math.abs(center - midY);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
        }
      });

      setActiveChapter((prev) => {
        if (prev !== closestId) {
          sceneManagerRef.current?.setActiveChapter(closestId);
          return closestId;
        }
        return prev;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    audioEngineRef.current?.setChapter(activeChapter);
  }, [activeChapter]);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      void audioEngineRef.current?.setEnabled(next);
      return next;
    });
  }, []);

  const handlePulseExhibit = useCallback((chapter: ChapterId) => {
    sceneManagerRef.current?.pulseExhibit(chapter);
  }, []);

  const handleSaveProfile = useCallback((nextProfile: ResumeProfile) => {
    setProfile(nextProfile);
    saveResumeProfile(nextProfile);
    sceneManagerRef.current?.updateResumeProfile(nextProfile);
  }, []);

  const handleResetProfile = useCallback(() => {
    const reset = clearSavedResumeProfile();
    setProfile(reset);
    sceneManagerRef.current?.updateResumeProfile(reset);
  }, []);

  // Keyboard shortcuts (M = Audio, 0-5 = Scroll Stages)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (modalState.open) return;

      if (e.key === 'm' || e.key === 'M') {
        handleToggleAudio();
      } else if (e.key === '0') {
        scrollToSection('overview');
      } else if (e.key === '1') {
        scrollToSection('cloud');
      } else if (e.key === '2') {
        scrollToSection('cicd');
      } else if (e.key === '3') {
        scrollToSection('observability');
      } else if (e.key === '4') {
        scrollToSection('security');
      } else if (e.key === '5') {
        scrollToSection('career');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalState.open, scrollToSection, handleToggleAudio]);

  // Keep audioEnabled accessible cleanly
  void audioEnabled;

  return (
    <div className="relative min-h-screen w-full bg-[#0b0e14]">
      {/* Fixed WebGL 3D Corridor Canvas (never unmounts on React state changes) */}
      <div
        ref={canvasMountRef}
        className="no-print fixed inset-0 w-screen h-screen z-0"
      />

      {/* Graceful WebGL Fallback Card if WebGL is unavailable */}
      {(webglError || contextLost) && (
        <div className="no-print fixed inset-0 z-10 flex items-center justify-center p-6 bg-[#0b0e14]/95">
          <div className="max-w-md w-full rounded-xl border border-white/15 bg-[#121722] p-6 text-center space-y-3">
            <h2 className="font-display text-lg font-semibold text-white">
              {contextLost
                ? '3D Graphics Context Paused'
                : '3D Viewport Unavailable'}
            </h2>
            <p className="text-sm text-slate-300">
              {contextLost
                ? 'Your browser paused the WebGL context. You can still read or print the complete resume below.'
                : webglError}
            </p>
            <button
              type="button"
              onClick={() => setModalState({ open: true, tab: 'view' })}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors cursor-pointer"
            >
              Open Full Resume
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <TopNavBar
        candidateName={profile.name}
        activeChapter={activeChapter}
        onScrollToSection={scrollToSection}
        onOpenFullResume={() => setModalState({ open: true, tab: 'view' })}
      />

      {/* Interactive Vertical Scroll-Down Core Skills Showcase */}
      <SkillScrollSections
        profile={profile}
        activeChapter={activeChapter}
        hoveredExhibit={hoveredExhibit}
        registerSectionRef={registerSectionRef}
        onScrollToSection={scrollToSection}
        onPulseExhibit={handlePulseExhibit}
        onOpenFullResume={(tab) => setModalState({ open: true, tab })}
      />

      {/* Full Printable Resume & Live Customizer Modal */}
      <FullResumeModal
        open={modalState.open}
        initialTab={modalState.tab}
        profile={profile}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
        onSaveProfile={handleSaveProfile}
        onResetProfile={handleResetProfile}
      />
    </div>
  );
}
