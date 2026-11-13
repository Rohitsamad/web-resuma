import { ResumeProfile } from '../types/resume';

export const DEFAULT_RESUME: ResumeProfile = {
  name: 'Rohit Kumar Samad',
  headline:
    'SRE / Platform & DevOps Engineer · Kubernetes, CI/CD, Observability & DevSecOps',
  location: 'India',
  availability: 'SRE / DevOps / Platform Roles',
  email: 'rohitsamad4@gmail.com',
  phone: '+91 9877495221',
  website: 'linkedin.com/in/rohit1010',
  github: 'linkedin.com/in/rohit1010',
  linkedin: 'linkedin.com/in/rohit1010',
  yearsExperience: '4+ Years',
  bio: 'Platform, SRE, and DevOps engineer with 4+ years of hands-on experience running production Kubernetes clusters, GitLab CI/CD pipelines, and Linux infrastructure across hybrid on-premises and Huawei Cloud (Flexible Engine) environments. Achieved a 99.98% SLA while leading VM-to-Kubernetes migrations, centralized observability with ELK, Prometheus, and Grafana, HashiCorp Vault secrets governance, and automated DevSecOps scanning.',
  keyMetrics: [
    { label: 'Production Platform SLA', value: '99.98%' },
    { label: 'Linux & Bash Scripting', value: '4+ Years' },
    { label: 'CI/CD, IaC & Observability', value: '3+ Years' },
    { label: 'Kubernetes & DevSecOps', value: '2+ Years' },
  ],
  experience: [
    {
      id: 'exp-orange',
      role: 'System Software Engineer',
      company: 'Orange Business',
      location: 'Hybrid Cloud & On-Premises',
      period: 'July 2021 — Present',
      impactMetric: '99.98% SLA · Hybrid K8s & CI/CD',
      summary:
        'Built and operated highly available, auto-scaled Kubernetes, CI/CD, observability, and identity infrastructure across on-premises cloud EC2 instances and Huawei Cloud (Flexible Engine).',
      highlights: [
        'Achieved a 99.98% SLA across production Kubernetes and GitLab CI/CD environments with autoscaling, rolling deployments, Nginx ingress, and Consul service registration.',
        'Migrated legacy VMs to Kubernetes using Helm and Rancher, integrating AI4Ops for anomaly detection and uptime monitoring while cutting operational overhead.',
        'Built centralized logging, dashboards, and alerting with ELK Stack, Kibana, Prometheus, and Grafana for real-time visibility and faster on-call incident triage.',
        'Developed GitLab CI pipelines with automated testing, Kaniko container image builds, artifact versioning, and DevSecOps scanning via Gitleaks and DefectDojo.',
        'Secured secrets with HashiCorp Vault and Ansible Vault, enforced cluster-wide IAM, opened security groups for flow enablement, and tuned Linux servers.',
        'Wrote Bash automation pulling from a lifecycle API to detect expired accounts and synchronize user records across OpenLDAP and LemonLDAP-NG.',
      ],
    },
    {
      id: 'exp-vtf',
      role: 'Intern',
      company: 'Virtually Testing Foundation',
      location: 'Remote',
      period: 'January 2021 — March 2021',
      impactMetric: 'Containers · Backup & VM Policies',
      summary:
        'Supported container operations, infrastructure hygiene, and Red Team security workshop initiatives.',
      highlights: [
        'Updated container images and automated backup processes for reliable recovery.',
        'Created and documented VM storage policies to standardize infrastructure provisioning.',
      ],
    },
  ],
  projects: [
    {
      id: 'sys-k8s',
      name: 'Hybrid Kubernetes & Cloud Migration',
      category: 'Platform Architecture',
      year: 'Orange Business',
      metric: '99.98% SLA · Auto-Scaled',
      description:
        'Migrated production VMs onto auto-scaled Kubernetes clusters across on-premises EC2 instances and Huawei Cloud (Flexible Engine) using Terraform, Ansible, Helm, and Rancher with Nginx ingress and Consul registration.',
      stack: 'Kubernetes · Terraform · Ansible · Helm · Rancher · Consul',
    },
    {
      id: 'sys-devsecops',
      name: 'GitLab DevSecOps CI/CD Pipeline',
      category: 'CI/CD & Security',
      year: 'Orange Business',
      metric: 'Automated Scan & Versioning',
      description:
        'Engineered end-to-end GitLab CI delivery pipelines with rootless Kaniko image builds, automated testing, artifact versioning, Gitleaks secret detection, and DefectDojo vulnerability compliance checks.',
      stack: 'GitLab CI · Kaniko · Gitleaks · DefectDojo · Docker',
    },
    {
      id: 'sys-obs',
      name: 'Centralized Observability & AI4Ops',
      category: 'SRE & Incident Response',
      year: 'Orange Business',
      metric: 'Real-Time Triage & On-Call',
      description:
        'Deployed full-stack telemetry, log aggregation, and alerting across Prometheus, Grafana, ELK Stack, Kibana dashboards, and AI4Ops anomaly detection, partnered with developers on production readiness.',
      stack: 'Prometheus · Grafana · ELK Stack · Kibana · AI4Ops',
    },
    {
      id: 'sys-iam',
      name: 'Secrets & Identity Lifecycle Automation',
      category: 'Security & Linux',
      year: 'Orange Business',
      metric: 'Zero-Touch LDAP Sync',
      description:
        'Enforced cluster IAM and secrets governance with HashiCorp Vault and Ansible Vault, paired with Bash automation syncing lifecycle API account expirations to OpenLDAP and LemonLDAP-NG.',
      stack: 'HashiCorp Vault · Ansible Vault · OpenLDAP · LemonLDAP-NG · Bash',
    },
  ],
  skills: [
    {
      id: 'skill-k8s',
      domain: 'Containers, IaC & Cloud',
      proficiency: '2–3+ yrs · Core',
      items: [
        'Kubernetes, Helm, Rancher & Docker',
        'Terraform, Ansible & Git',
        'Huawei Cloud (Flexible Engine) & On-Prem EC2',
        'Nginx Ingress, Autoscaling & Rolling Deploys',
        'Consul Registration & Security Groups',
      ],
    },
    {
      id: 'skill-obs',
      domain: 'Observability & CI/CD',
      proficiency: '3+ yrs · Production',
      items: [
        'Prometheus, Grafana & Alerting',
        'ELK Stack, Kibana Dashboards & Log Analysis',
        'AI4Ops Anomaly Detection & On-Call Readiness',
        'GitLab CI, Kaniko Image Builds & Versioning',
        'Automated Testing & Release Pipelines',
      ],
    },
    {
      id: 'skill-sec',
      domain: 'Security, Identity & Linux',
      proficiency: '2–4+ yrs · Foundation',
      items: [
        'Linux Administration, Patching & Tuning (4+ yrs)',
        'Bash Automation & Lifecycle API Scripting (4+ yrs)',
        'HashiCorp Vault & Ansible Vault',
        'IAM, OpenLDAP & LemonLDAP-NG',
        'Gitleaks & DefectDojo DevSecOps Scanning',
      ],
    },
  ],
  education: [
    {
      id: 'edu-btech',
      degree: 'B.Tech, Information Technology',
      institution: 'Lovely Professional University, Jalandhar',
      period: 'Aug 2017 — July 2021',
      honors: 'Undergraduate Engineering Degree in Information Technology',
    },
    {
      id: 'edu-inter',
      degree: 'Intermediate (Non-Medical)',
      institution: 'Sri Chaitanya Techno School, Visakhapatnam',
      period: '2015 — 2017',
      honors: 'Higher Secondary · Physics, Chemistry & Mathematics',
    },
  ],
  workshops: [
    'Red Hat Certified System Administrator (RHCSA) Workshop',
    'Virtually Testing Red Team Workshop',
  ],
  languages: ['English', 'Hindi'],
  softSkills: [
    'Collaboration',
    'Leadership',
    'Teamwork',
    'Communication',
    'Problem-solving',
  ],
  interests: ['Photography', 'Trekking', 'Music', 'Cooking'],
  pdfAttachments: [
    {
      id: 'pdf-sre',
      label: 'SRE / Platform Engineer Resume',
      focus: 'Kubernetes · Observability · Secrets · Incident Response',
      url: `${import.meta.env.BASE_URL}assets/aistudio/Rohit_Kumar_Samad_SRE_Resume_a51251fa.pdf`,
    },
    {
      id: 'pdf-devops',
      label: 'DevOps Engineer Resume',
      focus: 'CI/CD · Kubernetes · Terraform · Linux',
      url: `${import.meta.env.BASE_URL}assets/aistudio/ROHIT_KUMAR_SAMAD_fullstack_544ea4b5.pdf`,
    },
    {
      id: 'pdf-deloitte',
      label: 'DevOps & Platform (Deloitte Edition)',
      focus: 'Observability · Hybrid Cloud · DevSecOps',
      url: `${import.meta.env.BASE_URL}assets/aistudio/ROHIT_KUMAR_SAMAD_Deloitte_b1e3a9d4.pdf`,
    },
    {
      id: 'pdf-npci',
      label: 'DevOps & DevSecOps (NPCI Edition)',
      focus: 'Kubernetes · CI/CD · Linux · Vault & Security',
      url: `${import.meta.env.BASE_URL}assets/aistudio/ROHIT_KUMAR_SAMAD_NPCI_d36ef73d.pdf`,
    },
  ],
};

const STORAGE_KEY = 'rohit_samad_3d_portfolio_v2';

export function loadResumeProfile(): ResumeProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RESUME;
    const parsed = JSON.parse(raw) as Partial<ResumeProfile>;
    if (!parsed.name || !Array.isArray(parsed.experience)) {
      return DEFAULT_RESUME;
    }
    return {
      ...DEFAULT_RESUME,
      ...parsed,
    };
  } catch {
    return DEFAULT_RESUME;
  }
}

export function saveResumeProfile(profile: ResumeProfile): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function clearSavedResumeProfile(): ResumeProfile {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  return DEFAULT_RESUME;
}
