# SpeakCare

**Your voice, your way.** A visual communication companion for healthcare visits.

[Open in GitHub Codespaces](https://codespaces.new/PallLeuva/speakcare) · [Browse all source files](https://github.com/PallLeuva/speakcare/tree/main/dist)

SpeakCare helps a person express needs when speaking is difficult. Tap a visual phrase, describe discomfort, add your own words, and show or speak the message. Build a printable card explaining how you prefer to communicate.

## Run in GitHub Codespaces

1. Open [SpeakCare in Codespaces](https://codespaces.new/PallLeuva/speakcare) while signed in to **PallLeuva**, then choose **Create codespace**.
2. Wait for the environment setup to finish. SpeakCare starts automatically on port **3000**.
3. Open port **3000** from the **Ports** panel. The included dev-container configuration labels it “SpeakCare website” and forwards it automatically.
4. If you stop the development server, restart it in the terminal with:

```sh
npm run dev
```

No API key, database, account, npm install, or external dependency is required. Use Node.js 22 or newer. If port 3000 is occupied, run `npm run dev -- --port 3001` and forward that port instead.

## Publish the public website with GitHub Pages

The ready-to-publish website is in **docs/**. In [this repository’s Pages settings](https://github.com/PallLeuva/speakcare/settings/pages), set:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/docs**
- Click **Save**.

GitHub will show the live address on that settings page after deployment succeeds. The expected project address is `https://pallleuva.github.io/speakcare/`; this address only works after Pages is enabled and its deployment finishes. No ChatGPT-hosted URL is used.

Edit the application in `dist/`, then run `npm run build` and commit the regenerated `docs/` files to update the GitHub Pages website. The `docs/` folder is a generated deployment copy, not a second codebase to edit.

## All of the source code

The actual readable application is in `dist/`. This folder is deliberately **not minified or compiled**. Every line in the browser is the same source you edit. The website’s **View all source code** page provides a file browser and a downloadable ZIP.

| File | What to change here |
| --- | --- |
| `dist/index.html` | Page shell, metadata, scripts and styles |
| `dist/app.js` | State, UI, interaction handlers, speech, print and export |
| `dist/data.js` | English/Spanish phrases, labels, translations and SVG icons |
| `dist/compose.js` | Pure message composition, search and discomfort formatting |
| `dist/styles.css` | Colors, typography, components, print and accessibility styles |
| `dist/layout.css` | Desktop, tablet and phone layouts |
| `dist/source.html`, `dist/source.js`, `dist/source.css` | Built-in source code viewer |
| `scripts/server.mjs` | Node development server; exposes only the public `dist/` folder |
| `scripts/build.mjs` | Checks files and rebuilds the source viewer / ZIP |
| `scripts/start-codespace.sh` | Starts the preview on port 3000 when the Codespace starts |
| `tests/compose.test.mjs` | Message fidelity, language, search and catalog tests |
| `.devcontainer/devcontainer.json` | GitHub Codespaces environment and forwarded port |

## Features

- 16 visual communication phrases in English and Spanish, with categories and search.
- Select multiple phrases, append custom text, review the complete message, copy it, or display it in large text. On phones, a floating message button opens it without scrolling.
- Read-aloud with an available **local device voice** matching the board language; speech speed is adjustable. The app does not send text to a remote speech provider. Voice availability depends on the browser and operating system. Full-screen text remains available when no local voice is installed.
- Yes / No / Not sure response cards, shown immediately without changing the composed message.
- Body-area selection, explicit sensation, optional intensity (0–10) and optional timing. Left/right always refer to the patient’s body.
- Favorites, plus saved messages for the current visit.
- Editable communication card with preferences, optional name/support person and notes; printable or downloadable as text.
- Larger text, higher contrast, semantic controls, visible focus, native keyboard support, reduced-motion support and responsive layouts.
- No analytics, tracking scripts, account system or API requests.

## Data behavior and scope

All messages, care-card fields, discomfort descriptions and saved messages stay in JavaScript memory only. Reloading or closing the page clears them. Only catalog favorite IDs, board language, speech rate and display preferences are stored in `localStorage`; Reset preferences resets display and speech options. Browser-hosted website infrastructure can still process normal page requests; this is not a claim that hosting is anonymous.

Custom text stays exactly as entered when you switch languages. Built-in phrase translations are explicit catalog entries, not automatic translation. They are a prototype and need review by qualified bilingual healthcare users before real-world clinical use. The app supports communication; it does not diagnose, prescribe, monitor a patient, contact clinicians or dispatch emergency help. It is not a replacement for a qualified interpreter.

## AI disclosure for the hackathon

ChatGPT/Codex assisted with product planning, source-code generation, UI design, the draft bilingual phrase catalog, documentation and tests. **This version does not call a generative AI model at runtime.** Its message builder is deterministic and preserves selected statements and user text. Browser text-to-speech is not presented as a custom AI model. This uses the event’s allowance for disclosed AI coding assistance without paid API credits.

An optional future addition could be a consent-based, server-side rewrite service with original-text comparison. Do not describe that as an implemented feature. No clinical validation or user research is claimed.

## Development and checks

```sh
npm run check
npm test
npm run build
npm run dev
```

`build` regenerates `dist/source-code.json` and `dist/SpeakCare-source.zip` from the actual project files, then copies the website into `docs/` for GitHub Pages. Generated files are excluded from their own source bundle to avoid recursion. The source ZIP also excludes `.git`, credentials, hosting-specific identity and private runtime files.

The Node server is for development. For deployment, upload the contents of `dist/` to a static website host. No proprietary hosting is required. Configure production response headers and access policy in the host. HTTPS is recommended for the clipboard and browser APIs.

## Suggested demo flow

1. Select “I am in pain” and “Please give me time.” Show the composed message.
2. Open Describe discomfort, choose an area, sensation, intensity and timing, and add it to the message.
3. Show the message full screen. Read it aloud if your device provides a local voice.
4. Switch the board to Spanish and show the built-in translations; explain that custom text is preserved.
5. Open My care card, add communication preferences, and show its print preview.
6. Open View all source code to explain how the project is built.

## Useful technical references

- [GitHub Codespaces dev containers](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers)
- [MDN: available speech synthesis voices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices)
- [MDN: local versus remote speech voices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)

## Next steps

Test with users who rely on augmentative communication, have bilingual clinicians review the phrase catalog, add user-tested switch scanning / alternative input, and evaluate more languages. This first version has keyboard controls but does not claim formal accessibility certification.
