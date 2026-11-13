# Rohit Kumar Samad — Interactive 3D Portfolio

An interactive Three.js 3D career exhibition and resume portfolio built with React, TypeScript, and Tailwind CSS.

## Interactive Features
- **Five Procedural 3D Exhibits**:
  - `01` **Overview**: Kinetic drafting monolith with live-etched nameplate plaque
  - `02` **Experience**: Stepped chronology tower for System Software Engineer (Orange Business) & Intern (Virtually Testing Foundation)
  - `03` **Systems**: Dual-display platform workstation showcasing Kubernetes, GitLab DevSecOps, Observability, and Vault/IAM automation
  - `04` **Skills**: Orbital stack orrery with instanced discipline nodes
  - `05` **Credentials**: Architectural portal arch, drafting compass, and folio covering education, RHCSA/Red Team workshops, and contact
- **Camera & Scene Controls**: Click any 3D exhibit or marker to focus, drag to orbit, use the `Explode` slider to inspect sub-assemblies, switch finishes (`Titanium`, `Brass`, `Obsidian`), or press `H` for Zen Mode.
- **Resume Sheet & Live Customizer**: View a printable CV (`Print / Save PDF`), switch role emphasis (`SRE / Platform`, `DevOps & IaC`, `DevSecOps`), or customize details live in the browser.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## GitHub Pages Deployment (CI/CD)

This repository includes `.github/workflows/deploy-pages.yml` to automatically typecheck (`tsc --noEmit`), build with the right GitHub Pages `base` path, and deploy to GitHub Pages on every push to `main`.

1. Push to GitHub on the `main` branch:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In your GitHub repository, go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
