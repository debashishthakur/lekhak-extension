const providerSelect = document.getElementById('provider-select');
const openChatHotkeyInput = document.getElementById('hotkey-open-chat');
const privacyLogInput = document.getElementById('privacy-log');
const privacyTelemetryInput = document.getElementById('privacy-telemetry');
const saveButton = document.getElementById('save-settings');
const statusEl = document.getElementById('status');
const commandForm = document.getElementById('command-form');
const commandNameInput = document.getElementById('command-name');
const commandTemplateInput = document.getElementById('command-template');
const commandList = document.getElementById('command-list');

const providerFields = {
  openai: {
    key: document.querySelector('input[name="openai-key"]'),
    model: document.querySelector('input[name="openai-model"]')
  },
  anthropic: {
    key: document.querySelector('input[name="anthropic-key"]'),
    model: document.querySelector('input[name="anthropic-model"]')
  },
  gemini: {
    key: document.querySelector('input[name="gemini-key"]'),
    model: document.querySelector('input[name="gemini-model"]')
  }
};

let settings = null;

async function init() {
  const response = await chrome.runtime.sendMessage({ type: 'lekhak:get-settings' });
  if (response?.error) {
    statusEl.textContent = `Error loading settings: ${response.error}`;
    statusEl.style.color = '#ef4444';
    return;
  }
  settings = response;
  hydrateForm();
}

function hydrateForm() {
  if (!settings) return;
  providerSelect.value = settings.provider || 'mock';
  openChatHotkeyInput.value = settings.hotkeys?.openChat || 'Alt+W';
  privacyLogInput.checked = Boolean(settings.privacy?.logSessions);
  privacyTelemetryInput.checked = Boolean(settings.privacy?.shareTelemetry);

  Object.entries(providerFields).forEach(([key, fields]) => {
    const config = settings.providers?.[key] || {};
    if (fields.key) fields.key.value = config.apiKey || '';
    if (fields.model) fields.model.value = config.model || '';
  });

  renderCommands(settings.customCommands || []);
}

function renderCommands(commands) {
  commandList.innerHTML = '';
  commands.forEach((command) => {
    const li = document.createElement('li');
    li.dataset.id = command.id;
    const info = document.createElement('div');
    info.innerHTML = `<strong>${command.name}</strong><div>${command.template}</div>`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.addEventListener('click', async () => {
      await removeCommand(command.id);
    });
    li.appendChild(info);
    li.appendChild(remove);
    commandList.appendChild(li);
  });
}

async function removeCommand(id) {
  if (!settings) return;
  settings.customCommands = (settings.customCommands || []).filter((cmd) => cmd.id !== id);
  const response = await chrome.runtime.sendMessage({
    type: 'lekhak:update-settings',
    payload: { customCommands: settings.customCommands }
  });
  if (response?.error) {
    flashStatus(`Could not remove command: ${response.error}`, true);
    return;
  }
  settings = response;
  renderCommands(settings.customCommands || []);
  flashStatus('Command removed.');
}

saveButton.addEventListener('click', async () => {
  if (!settings) return;
  const payload = {
    provider: providerSelect.value,
    hotkeys: {
      openChat: openChatHotkeyInput.value.trim() || 'Alt+W'
    },
    privacy: {
      logSessions: privacyLogInput.checked,
      shareTelemetry: privacyTelemetryInput.checked
    },
    providers: {
      ...settings.providers,
      openai: {
        ...settings.providers?.openai,
        apiKey: providerFields.openai.key.value.trim(),
        model: providerFields.openai.model.value.trim() || 'gpt-4o-mini'
      },
      anthropic: {
        ...settings.providers?.anthropic,
        apiKey: providerFields.anthropic.key.value.trim(),
        model: providerFields.anthropic.model.value.trim() || 'claude-3-5-sonnet'
      },
      gemini: {
        ...settings.providers?.gemini,
        apiKey: providerFields.gemini.key.value.trim(),
        model: providerFields.gemini.model.value.trim() || 'gemini-1.5-pro'
      }
    }
  };

  const response = await chrome.runtime.sendMessage({
    type: 'lekhak:update-settings',
    payload
  });

  if (response?.error) {
    statusEl.textContent = `Save failed: ${response.error}`;
    statusEl.style.color = '#ef4444';
    return;
  }

  settings = response;
  flashStatus('Settings saved.');
});

commandForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!settings) return;
  const name = commandNameInput.value.trim();
  const template = commandTemplateInput.value.trim();
  if (!name || !template) return;

  const command = {
    id: crypto.randomUUID ? crypto.randomUUID() : `cmd-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    template
  };

  const updated = [...(settings.customCommands || []), command];
  const response = await chrome.runtime.sendMessage({
    type: 'lekhak:update-settings',
    payload: { customCommands: updated }
  });
  if (response?.error) {
    flashStatus(`Could not save command: ${response.error}`, true);
    return;
  }
  settings = response;
  commandNameInput.value = '';
  commandTemplateInput.value = '';
  renderCommands(settings.customCommands || []);
  flashStatus('Command saved.');
});

function flashStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ef4444' : '#0ea5e9';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 2500);
}

init().catch((error) => {
  statusEl.textContent = `Unexpected error: ${error.message}`;
  statusEl.style.color = '#ef4444';
});
