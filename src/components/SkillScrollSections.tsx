import { ArrowDown, Check, Copy, FileText, Pencil } from 'lucide-react';
import { useState } from 'react';
import { ChapterId, ResumeProfile } from '../types/resume';

interface SkillScrollSectionsProps {
  profile: ResumeProfile;
  activeChapter: ChapterId;
  hoveredExhibit: ChapterId | null;
  registerSectionRef: (id: ChapterId, el: HTMLElement | null) => void;
  onScrollToSection: (chapter: ChapterId) => void;
  onPulseExhibit: (chapter: ChapterId) => void;
  onOpenFullResume: (tab: 'view' | 'edit') => void;
}

interface InteractiveSkillNode {
  id: string;
  label: string;
  tenure: string;
  implementation: string;
  tools: string;
  outcome: string;
}

interface SkillPillarConfig {
  id: Exclude<ChapterId, 'overview' | 'career'>;
  index: string;
  title: string;
  meta: string;
  align: 'left' | 'right';
  summary: string;
  nodes: InteractiveSkillNode[];
}

const SKILL_PILLARS: SkillPillarConfig[] = [
  {
    id: 'cloud',
    index: '01.',
    title: 'Cloud, Kubernetes & Infrastructure as Code',
    meta: '2–3+ Years · Hybrid On-Prem EC2 & Huawei Cloud · 99.98% SLA',
    align: 'left',
    summary:
      'Designed and operated auto-scaled Kubernetes platforms across hybrid on-premises EC2 infrastructure and Huawei Cloud (Flexible Engine), migrating legacy virtual machines with repeatable IaC.',
    nodes: [
      {
        id: 'k8s-helm',
        label: 'Kubernetes, Helm & Rancher',
        tenure: '2+ yrs production',
        implementation:
          'Migrated production VMs onto auto-scaled Kubernetes workloads managed through Rancher and templated Helm charts with zero-downtime rolling deployments.',
        tools: 'Kubernetes · Helm · Rancher · Docker',
        outcome: '99.98% platform uptime with automated pod scaling',
      },
      {
        id: 'tf-ansible',
        label: 'Terraform & Ansible IaC',
        tenure: '3+ yrs automation',
        implementation:
          'Codified cluster topology, compute provisioning, and configuration baselines across hybrid environments to eliminate manual server drift.',
        tools: 'Terraform · Ansible · Git',
        outcome: 'Repeatable infrastructure provisioning across environments',
      },
      {
        id: 'ingress-consul',
        label: 'Nginx Ingress & Consul Discovery',
        tenure: '2+ yrs networking',
        implementation:
          'Configured Nginx ingress routing, security group flow enablement, and Consul service registration for resilient East-West and North-South traffic.',
        tools: 'Nginx Ingress · Consul · Security Groups',
        outcome: 'Predictable service discovery and zero-downtime cutovers',
      },
      {
        id: 'hybrid-cloud',
        label: 'Huawei Cloud & On-Prem EC2',
        tenure: '3+ yrs hybrid ops',
        implementation:
          'Bridged on-premises EC2 clusters with Huawei Cloud (Flexible Engine) workloads while standardizing VM storage and backup recovery policies.',
        tools: 'Huawei Cloud (Flexible Engine) · On-Prem EC2',
        outcome: 'Reduced operational overhead across dual infrastructure zones',
      },
    ],
  },
  {
    id: 'cicd',
    index: '02.',
    title: 'CI/CD Automation & DevSecOps Gates',
    meta: '3+ Years · GitLab CI · Rootless Kaniko · Security Scanning',
    align: 'right',
    summary:
      'Engineered automated delivery pipelines that build, version, test, and security-audit container artifacts before they ever reach production Kubernetes clusters.',
    nodes: [
      {
        id: 'gitlab-ci',
        label: 'GitLab CI & Artifact Versioning',
        tenure: '3+ yrs pipelines',
        implementation:
          'Architected multi-stage GitLab CI workflows running automated test suites, semantic artifact versioning, and environment-promoted releases.',
        tools: 'GitLab CI · Git · Automated Testing',
        outcome: 'Consistent, traceable production deployments',
      },
      {
        id: 'kaniko',
        label: 'Kaniko Container Image Builds',
        tenure: '2+ yrs containers',
        implementation:
          'Built immutable OCI container images inside Kubernetes without privileged Docker daemons using rootless Kaniko builders.',
        tools: 'Kaniko · Docker · Container Registries',
        outcome: 'Hardened daemonless image builds inside cluster runners',
      },
      {
        id: 'gitleaks',
        label: 'Gitleaks Secret Scanning',
        tenure: '2+ yrs DevSecOps',
        implementation:
          'Embedded automated Gitleaks credential detection directly into merge and CI stages to block hardcoded tokens or keys pre-merge.',
        tools: 'Gitleaks · GitLab CI',
        outcome: 'Zero leaked secrets promoted into release branches',
      },
      {
        id: 'defectdojo',
        label: 'DefectDojo Vulnerability Compliance',
        tenure: '2+ yrs security',
        implementation:
          'Consolidated pipeline security findings inside DefectDojo so engineering teams triage and remediate vulnerabilities continuously.',
        tools: 'DefectDojo · CI Compliance Gates',
        outcome: 'Unified vulnerability visibility prior to production rollout',
      },
    ],
  },
  {
    id: 'observability',
    index: '03.',
    title: 'Observability, Telemetry & AI4Ops',
    meta: '3+ Years · Prometheus, Grafana & ELK · On-Call Incident Triage',
    align: 'left',
    summary:
      'Built full-stack visibility across metrics, logs, and anomaly signals so SRE and product teams catch regressions early and maintain strict availability SLAs.',
    nodes: [
      {
        id: 'prom-grafana',
        label: 'Prometheus & Grafana Alerting',
        tenure: '3+ yrs telemetry',
        implementation:
          'Instrumented cluster, node, and service metrics with Prometheus scraping, Grafana executive/SRE dashboards, and actionable alert rules.',
        tools: 'Prometheus · Grafana · Alerting',
        outcome: 'Faster root-cause isolation during on-call rotations',
      },
      {
        id: 'elk-kibana',
        label: 'ELK Stack & Kibana Dashboards',
        tenure: '3+ yrs log analytics',
        implementation:
          'Centralized distributed application and system logs into Elasticsearch, Logstash, and Kibana views for real-time debugging.',
        tools: 'Elasticsearch · Logstash · Kibana',
        outcome: 'Single-pane log search across hybrid nodes',
      },
      {
        id: 'ai4ops',
        label: 'AI4Ops Anomaly Detection',
        tenure: 'Production SRE',
        implementation:
          'Integrated AI4Ops telemetry monitoring on migrated Kubernetes workloads to flag abnormal latency and saturation trends early.',
        tools: 'AI4Ops · Uptime Monitoring',
        outcome: 'Proactive anomaly triage sustaining 99.98% availability',
      },
      {
        id: 'oncall-sre',
        label: 'Production Readiness & On-Call',
        tenure: '4+ yrs operations',
        implementation:
          'Partnered directly with application developers on production readiness reviews, health probes, and incident response playbooks.',
        tools: 'Incident Triage · Runbooks · SLA Governance',
        outcome: 'Cut recurring operational incidents and manual escalations',
      },
    ],
  },
  {
    id: 'security',
    index: '04.',
    title: 'Linux, Identity & Secrets Governance',
    meta: '4+ Years Linux & Bash · HashiCorp Vault · OpenLDAP Sync',
    align: 'right',
    summary:
      'Rooted in deep Linux system administration, automated Bash lifecycle scripting, and strict cryptographic secrets and directory governance.',
    nodes: [
      {
        id: 'linux-admin',
        label: 'Linux Tuning & System Patching',
        tenure: '4+ yrs foundation',
        implementation:
          'Administered, patched, and performance-tuned production Linux hosts with RHCSA-grounded kernel, storage, and firewall hardening.',
        tools: 'Linux · RHCSA Practices · Sysctl & Patching',
        outcome: 'Hardened, high-throughput host layer for K8s & VMs',
      },
      {
        id: 'bash-ldap',
        label: 'Bash Lifecycle API & LDAP Sync',
        tenure: '4+ yrs scripting',
        implementation:
          'Authored Bash automation querying an identity lifecycle API to detect expired accounts and synchronize records across directories.',
        tools: 'Bash · OpenLDAP · LemonLDAP-NG · REST APIs',
        outcome: 'Zero-touch account deprovisioning & directory hygiene',
      },
      {
        id: 'vault',
        label: 'HashiCorp Vault & Ansible Vault',
        tenure: '2+ yrs secrets',
        implementation:
          'Secured runtime credentials, certificates, and deployment variables using HashiCorp Vault and encrypted Ansible Vault playbooks.',
        tools: 'HashiCorp Vault · Ansible Vault · IAM',
        outcome: 'Eliminated plaintext credentials across CI & runtime',
      },
      {
        id: 'cluster-iam',
        label: 'Cluster IAM & Flow Enablement',
        tenure: '2+ yrs access control',
        implementation:
          'Enforced least-privilege cluster-wide IAM policies and scoped firewall/security group rules for compliant multi-service traffic.',
        tools: 'Kubernetes RBAC/IAM · Security Groups',
        outcome: 'Auditable access boundaries across environments',
      },
    ],
  },
];

export function SkillScrollSections({
  profile,
  activeChapter,
  hoveredExhibit,
  registerSectionRef,
  onScrollToSection,
  onPulseExhibit,
  onOpenFullResume,
}: SkillScrollSectionsProps) {
  const [selectedSkillByPillar, setSelectedSkillByPillar] = useState<
    Record<string, string>
  >({
    cloud: 'k8s-helm',
    cicd: 'gitlab-ci',
    observability: 'prom-grafana',
    security: 'linux-admin',
  });
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleSelectSkillNode = (
    pillarId: Exclude<ChapterId, 'overview' | 'career'>,
    nodeId: string,
  ) => {
    setSelectedSkillByPillar((prev) => ({ ...prev, [pillarId]: nodeId }));
    onPulseExhibit(pillarId);
  };

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
    <main className="relative z-10 pointer-events-none">
      {/* ================================================================= */}
      {/* SECTION 00 — HERO / OVERVIEW                                      */}
      {/* ================================================================= */}
      <section
        id="section-overview"
        ref={(el) => registerSectionRef('overview', el)}
        className="min-h-screen flex items-center px-5 md:px-10 lg:px-16 pt-24 pb-16"
      >
        <div className="pointer-events-auto w-full max-w-xl rounded-xl border border-white/12 bg-[#0d1118]/92 p-6 md:p-8 shadow-2xl space-y-6">
          <div className="space-y-2.5">
            <p className="font-mono-tabular text-xs text-amber-400">
              {profile.yearsExperience} Experience · {profile.availability}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
              {profile.name}
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-200 leading-snug">
              {profile.headline}
            </p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {profile.bio}
          </p>

          {/* 4 Quantitative Proof Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
            {profile.keyMetrics.map((metric) => (
              <div
                key={metric.label}
                className="p-3 rounded-lg border border-white/10 bg-white/[0.02]"
              >
                <div className="font-mono-tabular text-lg font-semibold text-amber-400">
                  {metric.value}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onScrollToSection('cloud')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-300"
            >
              <span>Explore Core Skills</span>
              <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onOpenFullResume('view')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border border-white/15 bg-white/[0.03] text-slate-200 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Full Resume & PDF</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 pt-1 border-t border-white/8">
            Scroll down to fly through each 3D skill assembly · Drag the 3D
            sculpture on the right to inspect
            {hoveredExhibit === 'overview' ? ' · Monolith focused' : ''}
          </p>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTIONS 01–04 — INTERACTIVE CORE SKILL PILLARS                   */}
      {/* ================================================================= */}
      {SKILL_PILLARS.map((pillar) => {
        const selectedId =
          selectedSkillByPillar[pillar.id] ?? pillar.nodes[0].id;
        const activeNode =
          pillar.nodes.find((n) => n.id === selectedId) ?? pillar.nodes[0];
        const isSectionActive = activeChapter === pillar.id;
        const alignClass =
          pillar.align === 'right' ? 'lg:ml-auto' : 'lg:mr-auto';

        return (
          <section
            key={pillar.id}
            id={`section-${pillar.id}`}
            ref={(el) => registerSectionRef(pillar.id, el)}
            className="min-h-screen flex items-center px-5 md:px-10 lg:px-16 py-24"
          >
            <div
              className={`pointer-events-auto w-full max-w-xl ${alignClass} rounded-xl border transition-colors duration-200 bg-[#0d1118]/92 p-6 md:p-8 shadow-2xl space-y-5 ${
                isSectionActive || hoveredExhibit === pillar.id
                  ? 'border-amber-400/45'
                  : 'border-white/12'
              }`}
            >
              <div className="space-y-2">
                <div className="font-mono-tabular text-xs text-slate-400">
                  {pillar.meta}
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white text-balance">
                  <span className="font-mono-tabular text-amber-400 mr-2">
                    {pillar.index}
                  </span>
                  {pillar.title}
                </h2>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {pillar.summary}
              </p>

              {/* Interactive Skill Node Selector */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <div className="text-xs font-medium text-slate-400">
                  Select a core capability to inspect production usage:
                </div>
                <div
                  role="group"
                  aria-label={`${pillar.title} capabilities`}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  {pillar.nodes.map((node) => {
                    const selected = node.id === activeNode.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          handleSelectSkillNode(pillar.id, node.id)
                        }
                        className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${
                          selected
                            ? 'border-amber-400 bg-amber-400/12 text-white font-semibold'
                            : 'border-white/10 bg-white/[0.02] text-slate-300 hover:text-white hover:border-white/25'
                        }`}
                      >
                        <div className="truncate">{node.label}</div>
                        <div
                          className={`font-mono-tabular text-[11px] mt-0.5 truncate ${
                            selected ? 'text-amber-300' : 'text-slate-400'
                          }`}
                        >
                          {node.tenure}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Skill Implementation Detail */}
              <div className="rounded-lg border border-white/10 bg-black/35 p-4 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-white">
                    {activeNode.label}
                  </h3>
                  <span className="font-mono-tabular text-[11px] text-amber-400">
                    {activeNode.tenure}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeNode.implementation}
                </p>
                <div className="pt-2 border-t border-white/8 flex flex-col gap-1 text-xs">
                  <div className="font-mono-tabular text-slate-400">
                    Stack: {activeNode.tools}
                  </div>
                  <div className="text-amber-300">
                    Outcome: {activeNode.outcome}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ================================================================= */}
      {/* SECTION 05 — PROVEN EXPERIENCE, CREDENTIALS & CONTACT             */}
      {/* ================================================================= */}
      <section
        id="section-career"
        ref={(el) => registerSectionRef('career', el)}
        className="min-h-screen flex items-center px-5 md:px-10 lg:px-16 pt-24 pb-24"
      >
        <div
          className={`pointer-events-auto w-full max-w-xl rounded-xl border transition-colors duration-200 bg-[#0d1118]/92 p-6 md:p-8 shadow-2xl space-y-6 ${
            activeChapter === 'career' || hoveredExhibit === 'career'
              ? 'border-amber-400/45'
              : 'border-white/12'
          }`}
        >
          <div className="space-y-1.5">
            <div className="font-mono-tabular text-xs text-slate-400">
              Production Track Record · Education · Direct Contact
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white text-balance">
              <span className="font-mono-tabular text-amber-400 mr-2">05.</span>
              Proven Experience & Credentials
            </h2>
          </div>

          {/* Experience Timeline */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            {profile.experience.map((exp, idx) => (
              <article
                key={exp.id}
                className={
                  idx < profile.experience.length - 1
                    ? 'pb-4 border-b border-white/10'
                    : ''
                }
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-white">
                    {exp.role}{' '}
                    <span className="font-normal text-slate-400">
                      — {exp.company}
                    </span>
                  </h3>
                  <span className="font-mono-tabular text-xs text-amber-400">
                    {exp.period}
                  </span>
                </div>
                <div className="font-mono-tabular text-[11px] text-slate-400 mt-1">
                  {exp.location} · {exp.impactMetric}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                  {exp.summary}
                </p>
              </article>
            ))}
          </div>

          {/* Education & Workshops */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10">
            <div className="space-y-2">
              <h3 className="font-display text-sm font-semibold text-slate-200">
                Education
              </h3>
              {profile.education.map((edu) => (
                <div key={edu.id} className="text-xs space-y-0.5">
                  <div className="text-white font-medium">{edu.degree}</div>
                  <div className="text-slate-400">{edu.institution}</div>
                  <div className="font-mono-tabular text-amber-400 text-[11px]">
                    {edu.period}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-sm font-semibold text-slate-200">
                Workshops & Strengths
              </h3>
              <ul className="space-y-1 text-xs text-slate-300">
                {profile.workshops.map((w) => (
                  <li key={w}>— {w}</li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-400 pt-1">
                {profile.softSkills.join(' · ')}
              </p>
            </div>
          </div>

          {/* Direct Contact & Resume Actions */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-white/10 bg-black/35">
              <a
                href={`mailto:${profile.email}`}
                className="font-mono-tabular text-xs text-amber-300 hover:underline truncate"
              >
                {profile.email}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer shrink-0"
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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono-tabular text-xs text-slate-400">
                {profile.linkedin}
                {profile.phone ? ` · ${profile.phone}` : ''}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenFullResume('edit')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-white/15 text-slate-200 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Edit Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenFullResume('view')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Print / Full CV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
