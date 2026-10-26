# HeroGen

Featured-image generator for client blog posts. Swap in a client's logo, set the
color block to their theme color, pick a background, type the headline — and
export a finished image at **exactly 1440 × 1080**.

## What it does

- **Custom logo** — click or drag-and-drop any SVG/PNG/JPG/WebP logo, with a size slider.
- **Color block picker** — native color picker + hex input, plus an opacity slider.
- **Background swap** — click or drag-and-drop any image (it covers the full canvas).
- **Headline** — editable text on the right side of the block, with its own
  color picker + hex input (saved with the profile).
- **Interface theme** — a Dark/Light toggle in the header. It themes only the
  app's own interface and is remembered in the browser/app; it never changes
  the exported image.
- **Responsive layout** — on narrow screens the preview moves above the
  controls, panels reflow into a grid (then a single column), and the header
  and export button wrap. The stage itself stays 1440 × 1080 and just scales
  to fit, so exports are unaffected.
- **Profiles** — save all of the above under a name and recall it in one click.
  Profiles can also be exported/imported as a JSON file to move between machines.
  - Desktop app: profiles are stored in `herogen-profiles.json` in the app's
    user-data folder (on Linux: `~/.config/herogen/`, macOS:
    `~/Library/Application Support/herogen/`, Windows: `%APPDATA%/herogen/`).
  - Plain browser: profiles are stored in that browser's localStorage.
- **Export** — WebP (default), PNG or JPG, always rendered at 1440 × 1080,
  filename based on the profile name / headline.

## Run it in a browser

No build step — just serve or open the folder:

```bash
npx serve .        # or: python3 -m http.server
# open index.html
```

Note: opening via `file://` also works in most browsers, but localStorage
profile storage is more reliable over `http://` or in the desktop app.

## Run the desktop app (development)

Requires Node.js 20+.

```bash
npm install
npm start
```

## Build installers (Mac / Windows / Linux)

```bash
npm install
npm run dist        # build for your current OS
npm run dist:mac    # .dmg + .zip   (must run on a Mac for a signed/usable build)
npm run dist:win    # NSIS installer + portable .exe (can cross-build from Linux/macOS)
npm run dist:linux  # AppImage + .deb
```

Output goes to `dist/`.

## Distributing a release

Push a version tag and the Actions workflow builds all three platforms
natively and attaches the installers to a **draft GitHub Release** for that
tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

When the builds finish, open the repo's **Releases** page, check the assets
(Linux AppImage + .deb, Windows installer + portable .exe, Mac .dmg + .zip),
write release notes, and click **Publish release**. Anyone can then download
from `github.com/art4ur/HeroGen/releases`, and
`.../releases/latest` always points at the newest published release.

**Recommended for Windows/Mac:** don't cross-build. The repo has a GitHub
Actions workflow (`.github/workflows/build.yml`) that builds each platform on
its own native runner — run it manually from the Actions tab, or push a `v*`
tag. Installers land as downloadable artifacts per OS. This matters because
cross-building Windows from Linux requires Wine just to stamp the exe icon
and metadata.

Cross-building notes (electron-builder):

- **macOS** builds effectively need to run on a Mac; code signing/notarization
  needs an Apple Developer certificate. Unsigned builds work locally but
  Gatekeeper will warn on first open.
- **Windows** builds can be produced from Linux/macOS; signing is optional for
  internal use (SmartScreen will warn on unsigned installers).
- **Linux** AppImage runs on most distros without installation.

## Layout

| File | Purpose |
|---|---|
| `index.html` / `style.css` / `app.js` | The generator UI and logic |
| `main.js` / `preload.js` | Electron main process + profile-file bridge |
| `logo.svg` | Bundled placeholder logo (a plain circle — swap in a real logo in the app). The default background is a solid color defined in `style.css`; there is no bundled background image |
| `build/icon.png` + `build/icons/` + `assets/icon.png` | The "General" app icon: master 1024px, a full Linux icon set, and the window icon the app loads at runtime |
| `vendor/html2canvas.min.js` | Vendored html2canvas 1.4.1 (MIT) — no CDN needed, works offline |
