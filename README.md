# Lekhak Chrome Extension (Concept Build)

This extension recreates the Lekhak writing assistant experience described in the product docs. It targets Chrome Manifest V3 and provides:

- Inline tooltip assistant that appears when text is selected or the user presses `Alt+W`
- Chat overlay for research / brainstorming with history
- Voice dictation via the Web Speech API
- Multi-provider LLM adapter with BYOK keys (OpenAI, Anthropic, Google Gemini, local Gemini Nano when available)
- Custom command manager and tone presets stored in `chrome.storage`
- Options page to manage providers, hotkeys, privacy, and custom prompts

The implementation files are organised so that each module maps to one of the functional blocks outlined in the documentation:

| Module | Responsibility |
| --- | --- |
| `manifest.json` | Declares permissions, commands, resources (MV3) |
| `background/worker.js` | Service worker with provider router, history store, context menus |
| `content/contentScript.js` | Injects tooltip, watches selections, routes actions |
| `content/tooltip.js` | Tooltip UI, action buttons, voice controls |
| `content/chatOverlay.js` | Chat modal in shadow DOM |
| `shared/providers/*.js` | LLM adapters (OpenAI, Anthropic, Gemini, mock) |
| `shared/storage.js` | Wrapper for chrome.storage (sync/local) and migrations |
| `shared/prompts.js` | Prompt templates from documentation |
| `options/*` | Options UI for keys, feature toggles, custom commands |
| `popup/*` | Minimal popup that opens chat overlay |

The code emphasises:
- Selection-safe replacements for text fields and contentEditable surfaces
- Privacy-first defaults (local storage, no background logging)
- Internationalisation groundwork (locale strings placeholder)
- Clear extension points for future monetisation tiers

## Quick start

1. Open `chrome://extensions` in a Chromium-based browser.
2. Enable *Developer mode* and choose *Load unpacked*.
3. Select the `lekhak_extension` folder.
4. Configure provider keys and preferences via *Extension details → Extension options*.
5. Highlight text on any page to reveal the inline Lekhak tooltip or press `Alt+W` to open the chat overlay.

## Automated testing (Playwright)

The `tests/` directory contains an integration suite driven by Playwright that loads the extension into a real Chromium instance, opens a local fixture page, and exercises the selection badge + panel flow.

### Setup

```bash
cd lekhak_extension
npm install
```

### Run the tests

```bash
npm test
```

The suite uses `file://` fixtures and the mock provider, so it does not require live API keys. To watch the run interactively, use `npm run test:headed`.

See inline TODO notes for integrating real API endpoints and expanding editor compatibility per the spec.
