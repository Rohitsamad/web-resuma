/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AmbientAudioEngine } from './audio/AmbientAudioEngine';
import { ControlDock } from './components/ControlDock';
import { ExhibitDossierDrawer } from './components/ExhibitDossierDrawer';
import { FullResumeModal } from './components/FullResumeModal';
import { TopNavBar } from './components/TopNavBar';
import {
  clearSavedResumeProfile,
  loadResumeProfile,
  saveResumeProfile,
} from './data/defaultResume';
import { ResumeSceneManager } from './three/ResumeSceneManager';
import {
  CameraViewId,
  ChapterId,
  MaterialFinish,
  ResumeProfile,
} from './types/resume';

const EXHIBIT_MARKERS: { id: ChapterId; num: string; label: string }[] = [
  { id: 'overview', num: '01', label: 'Overview' },
  { id: 'experience', num: '02', label: 'Experience' },
  { id: 'projects', num: '03', label: 'Systems' },
  { id: 'skills', num: '04', label: 'Skills' },
  { id: 'credentials', num: '05', label: 'Credentials' },
];

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneManagerRef = useRef<ResumeSceneManager | null>(null);
  const audioEngineRef = useRef<AmbientAudioEngine | null>(null);
  const markerRefs = useRef<Partial<Record<ChapterId, HTMLButtonElement | null>>>({});

  const [profile, setProfile] = useState<ResumeProfile>(() =>
    loadResumeProfile(),
  );
  const [activeChapter, setActiveChapter] = useState<ChapterId>('overview');
  const [activeView, setActiveView] = useState<CameraViewId>('overview');
  const [hoveredExhibit, setHoveredExhibit] = useState<ChapterId | null>(null);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    open: boolean;
    tab: 'view' | 'edit';
  }>({ open: false, tab: 'view' });
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [explode, setExplode] = useState(0);
  const [finish, setFinish] = useState<MaterialFinish>('titanium');
  const [autoRotate, setAutoRotate] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  const handleSelectExhibitFromCanvas = useCallback((chapter: ChapterId) => {
    setActiveChapter(chapter);
    setActiveView(chapter);
    setDossierOpen(true);
  }, []);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    let manager: ResumeSceneManager | null = null;
    try {
      manager = new ResumeSceneManager(container, profile, {
        onSelectExhibit: handleSelectExhibitFromCanvas,
        onHoverExhibit: setHoveredExhibit,
        onContextLostChange: setContextLost,
      });
      sceneManagerRef.current = manager;

      EXHIBIT_MARKERS.forEach((m) => {
        manager?.registerMarkerElement(m.id, markerRefs.current[m.id] ?? null);
      });
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
  }, [handleSelectExhibitFromCanvas]);

  useEffect(() => {
    audioEngineRef.current?.setChapter(activeChapter);
  }, [activeChapter]);

  const navigateToChapter = useCallback(
    (chapter: ChapterId, openDossier = true) => {
      setActiveChapter(chapter);
      setActiveView(chapter);
      sceneManagerRef.current?.setActiveChapter(chapter);
      sceneManagerRef.current?.focusView(chapter);
      if (openDossier) setDossierOpen(true);
    },
    [],
  );

  const handleSelectView = useCallback((view: CameraViewId) => {
    setActiveView(view);
    if (view !== 'gallery') {
      setActiveChapter(view);
      sceneManagerRef.current?.setActiveChapter(view);
    }
    sceneManagerRef.current?.focusView(view);
  }, []);

  const handleChangeExplode = useCallback((value: number) => {
    setExplode(value);
    sceneManagerRef.current?.setExplodeAmount(value);
  }, []);

  const handleChangeFinish = useCallback((nextFinish: MaterialFinish) => {
    setFinish(nextFinish);
    sceneManagerRef.current?.setFinish(nextFinish);
  }, []);

  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => {
      const next = !prev;
      sceneManagerRef.current?.setAutoRotate(next);
      return next;
    });
  }, []);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      void audioEngineRef.current?.setEnabled(next);
      return next;
    });
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

  // Keyboard shortcuts (H = Zen Mode, 0 = Gallery, 1-5 = Exhibits)
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

      if (e.key === 'h' || e.key === 'H') {
        setControlsCollapsed((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleAudio();
      } else if (e.key === '0') {
        handleSelectView('gallery');
      } else if (e.key === '1') {
        navigateToChapter('overview', false);
      } else if (e.key === '2') {
        navigateToChapter('experience', false);
      } else if (e.key === '3') {
        navigateToChapter('projects', false);
      } else if (e.key === '4') {
        navigateToChapter('skills', false);
      } else if (e.key === '5') {
        navigateToChapter('credentials', false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalState.open, handleSelectView, navigateToChapter, handleToggleAudio]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0e14] select-none">
      {/* Dedicated WebGL Mount Container (isolated from React HUD re-renders) */}
      <div
        ref={canvasMountRef}
        className="no-print fixed inset-0 w-full h-full z-0"
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

      {/* 3D-Projected Exhibit Anchor Markers (positioned via ref at 60fps, hidden in Zen Mode) */}
      <div
        aria-hidden={controlsCollapsed || modalState.open}
        className={`no-print fixed inset-0 z-10 pointer-events-none transition-opacity duration-200 ${
          controlsCollapsed || modalState.open ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {EXHIBIT_MARKERS.map((marker) => {
          const isActive = activeChapter === marker.id;
          const isHovered = hoveredExhibit === marker.id;
          return (
            <button
              key={marker.id}
              ref={(el) => {
                markerRefs.current[marker.id] = el;
              }}
              type="button"
              onClick={() => navigateToChapter(marker.id, true)}
              className={`absolute top-0 left-0 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive || isHovered
                  ? 'bg-[#121826]/95 border-amber-400/80 text-amber-300 shadow-lg'
                  : 'bg-[#0b0e14]/88 border-white/15 text-slate-200 hover:border-amber-400/60 hover:text-white'
              }`}
              style={{ opacity: 0 }}
            >
              <span className="font-mono-tabular text-amber-400 mr-1.5">
                {marker.num}
              </span>
              <span>{marker.label}</span>
            </button>
          );
        })}
      </div>

      {/* Top Navigation Bar */}
      <TopNavBar
        candidateName={profile.name}
        activeChapter={activeChapter}
        activeView={activeView}
        onNavigateChapter={(ch, open) => navigateToChapter(ch, open)}
        onOpenFullResume={() => setModalState({ open: true, tab: 'view' })}
      />

      {/* Toggleable Exhibit Dossier Sheet */}
      <ExhibitDossierDrawer
        open={dossierOpen && !modalState.open}
        chapter={activeChapter}
        profile={profile}
        onClose={() => setDossierOpen(false)}
        onSelectChapter={(ch) => navigateToChapter(ch, true)}
        onOpenFullResume={() => setModalState({ open: true, tab: 'view' })}
      />

      {/* Unified Collapsible Bottom Control Dock */}
      <ControlDock
        profile={profile}
        collapsed={controlsCollapsed}
        onToggleCollapsed={() => setControlsCollapsed((prev) => !prev)}
        activeChapter={activeChapter}
        activeView={activeView}
        explode={explode}
        finish={finish}
        autoRotate={autoRotate}
        audioEnabled={audioEnabled}
        onSelectView={handleSelectView}
        onOpenDossier={(ch) => {
          setActiveChapter(ch);
          setDossierOpen(true);
        }}
        onOpenEditor={() => setModalState({ open: true, tab: 'edit' })}
        onChangeExplode={handleChangeExplode}
        onChangeFinish={handleChangeFinish}
        onToggleAutoRotate={handleToggleAutoRotate}
        onToggleAudio={handleToggleAudio}
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
