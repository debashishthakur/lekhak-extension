const NAMESPACE = 'lekhak-settings';
const DEFAULT_SETTINGS = {
  provider: 'gemini',
  model: 'mock-basic',
  selectedModel: 'gemini', // Default selected model for the UI
  providers: {
    openai: { apiKey: '', model: 'gpt-4o-mini' },
    anthropic: { apiKey: '', model: 'claude-3-5-sonnet' },
    gemini: { apiKey: 'AIzaSyDOa8PSBPiNyLJ22DGONrV_WAIEPiyObIg', model: 'gemini-1.5-flash' },
    mock: { enabled: true }
  },
  customCommands: [],
  hotkeys: {
    openChat: 'Alt+W'
  },
  privacy: {
    logSessions: false,
    shareTelemetry: false
  },
  prompts: {
    rewrite: 'Task: Rewrite the selection for clarity while keeping meaning. Selection: """{selection}""" Return only the revised text.',
    grammar: 'Task: Fix grammar, spelling, and punctuation while preserving tone. Selection: """{selection}""" Return only corrected text.',
    shorten: 'Task: Shorten the selection to {target} words while keeping core meaning. Selection: """{selection}""" Return only the shortened text.',
    expand: 'Task: Expand the selection with additional helpful detail, max +30%. Selection: """{selection}""" Return only the expanded text.',
    tone: 'Task: Rephrase the selection with tone {tone}. Keep facts accurate. Selection: """{selection}""" Return only the rewritten text.',
    translate: 'Task: Translate the selection to {language}. Preserve names. Selection: """{selection}"""',
    dictation: 'Task: Clean up informal dictation into concise sentences without fillers. Text: """{transcript}""" Return only the cleaned text.',
    chat: 'You are a concise, high-precision writing assistant. Never invent citations.'
  }
};

export async function loadSettings() {
  const stored = await chrome.storage.local.get(NAMESPACE);
  return { ...DEFAULT_SETTINGS, ...(stored[NAMESPACE] || {}) };
}

export async function saveSettings(update) {
  const existing = await loadSettings();
  const merged = { ...existing, ...update };
  await chrome.storage.local.set({ [NAMESPACE]: merged });
  return merged;
}

export async function setProviderConfig(provider, config) {
  const existing = await loadSettings();
  const providers = { ...existing.providers, [provider]: { ...existing.providers[provider], ...config } };
  return saveSettings({ providers });
}

export async function addCustomCommand(command) {
  const existing = await loadSettings();
  const customCommands = [...existing.customCommands, command];
  return saveSettings({ customCommands });
}

export async function updateCustomCommand(id, update) {
  const existing = await loadSettings();
  const customCommands = existing.customCommands.map((cmd) => (cmd.id === id ? { ...cmd, ...update } : cmd));
  return saveSettings({ customCommands });
}

export async function removeCustomCommand(id) {
  const existing = await loadSettings();
  const customCommands = existing.customCommands.filter((cmd) => cmd.id !== id);
  return saveSettings({ customCommands });
}

export function getDefaultPrompts() {
  return DEFAULT_SETTINGS.prompts;
}

export function getNamespace() {
  return NAMESPACE;
}
