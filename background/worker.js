import { loadSettings, saveSettings } from '../shared/storage.js';
import { callProvider } from '../shared/providers/index.js';
import { PROMPTS } from '../shared/prompts.js';

chrome.runtime.onInstalled.addListener(async () => {
  await ensureContextMenus();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'wandpen-open-chat' && command !== 'lekhak-open-chat') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'wandpen:toggle-chat', source: 'command' });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message);
  
  const { type } = message || {};
  if (!type) {
    console.warn('❌ Message missing type field:', message);
    return;
  }
  
  switch (type) {
    case 'wandpen:execute-action':
    case 'lekhak:execute-action':
      console.log('🎯 Handling execute action');
      handleExecuteAction(message).then(result => {
        console.log('✅ Execute action response:', result);
        sendResponse(result);
      }).catch((error) => {
        console.error('❌ Execute action error:', error);
        sendResponse({ error: error.message });
      });
      return true;
    case 'wandpen:chat-message':
    case 'lekhak:chat-message':
      console.log('💬 Handling chat message');
      handleChatMessage(message).then(result => {
        console.log('✅ Chat message response:', result);
        sendResponse(result);
      }).catch((error) => {
        console.error('❌ Chat message error:', error);
        sendResponse({ error: error.message });
      });
      return true;
    case 'wandpen:selection-chat':
    case 'lekhak:selection-chat':
      console.log('🎯 Handling selection chat');
      handleSelectionAssist(message).then(result => {
        console.log('✅ Selection chat response:', result);
        sendResponse(result);
      }).catch((error) => {
        console.error('❌ Selection chat error:', error);
        sendResponse({ error: error.message });
      });
      return true;
    case 'wandpen:chat-followup':
    case 'lekhak:chat-followup':
      console.log('🔄 Handling chat followup');
      handleChatFollowup(message).then(result => {
        console.log('✅ Chat followup response:', result);
        sendResponse(result);
      }).catch((error) => {
        console.error('❌ Chat followup error:', error);
        sendResponse({ error: error.message });
      });
      return true;
    case 'wandpen:get-settings':
    case 'lekhak:get-settings':
      console.log('⚙️ Handling get settings');
      loadSettings().then(result => {
        console.log('✅ Get settings response:', result);
        sendResponse(result);
      }).catch((error) => {
        console.error('❌ Get settings error:', error);
        sendResponse({ error: error.message });
      });
      return true;
    case 'wandpen:update-settings':
    case 'lekhak:update-settings':
      console.log('💾 Handling update settings');
      saveSettings(message.payload).then(result => {
        console.log('✅ Update settings response:', result);
        sendResponse(result);
      }).catch((error) => {
        console.error('❌ Update settings error:', error);
        sendResponse({ error: error.message });
      });
      return true;
    default:
      console.warn('❓ Unknown message type:', type);
      return undefined;
  }
});

async function handleExecuteAction(message) {
  const { action, text, options = {} } = message;
  const settings = await loadSettings();
  const providerId = settings.provider || 'mock';
  const providerConfig = settings.providers?.[providerId] || {};
  const promptTemplate = PROMPTS[action]?.template || settings.prompts?.[action];
  const system = settings.prompts?.chat || PROMPTS.chat.template;

  const filledPrompt = fillTemplate(promptTemplate, {
    selection: text,
    transcript: text,
    tone: options.tone || 'neutral',
    language: options.language || 'English',
    target: options.target || 80
  });

  const response = await callProvider(providerId, {
    apiKey: providerConfig.apiKey,
    model: providerConfig.model,
    system,
    messages: [
      {
        role: 'user',
        content: filledPrompt
      }
    ],
    temperature: options.temperature || 0.4,
    maxTokens: options.maxTokens || 512,
    action,
    selection: text,
    tone: options.tone,
    language: options.language
  });

  return {
    text: response.text,
    provider: providerId,
    raw: response.raw
  };
}

async function handleChatMessage(message) {
  const { history = [], prompt } = message;
  const settings = await loadSettings();
  const providerId = settings.provider || 'mock';
  const providerConfig = settings.providers?.[providerId] || {};
  const system = settings.prompts?.chat || PROMPTS.chat.template;

  const response = await callProvider(providerId, {
    apiKey: providerConfig.apiKey,
    model: providerConfig.model,
    system,
    messages: [...history, { role: 'user', content: prompt }].filter(Boolean),
    temperature: 0.6,
    maxTokens: 600,
    action: 'chat',
    selection: prompt
  });

  return {
    text: response.text,
    provider: providerId,
    raw: response.raw
  };
}

async function handleSelectionAssist(message) {
  const { selection = '', instruction = '', model = 'gemini' } = message;
  const trimmedSelection = selection.trim();
  
  console.log('🔍 handleSelectionAssist debug:', {
    selection: trimmedSelection.substring(0, 100) + '...',
    instruction: instruction.substring(0, 100) + '...',
    model,
    selectionLength: trimmedSelection.length,
    instructionLength: instruction.length
  });
  
  const settings = await loadSettings();
  console.log('⚙️ Settings loaded:', {
    defaultProvider: settings.provider,
    hasGeminiKey: !!settings.providers?.gemini?.apiKey,
    geminiModel: settings.providers?.gemini?.model,
    providersAvailable: Object.keys(settings.providers || {})
  });
  
  if (!trimmedSelection) {
    throw new Error('No text selected.');
  }
  
  // Map model names to provider IDs
  const modelToProvider = {
    'gemini': 'gemini',
    'claude': 'anthropic', 
    'gpt': 'openai'
  };
  
  const providerId = modelToProvider[model] || settings.provider || 'gemini';
  const providerConfig = settings.providers?.[providerId] || {};
  
  // If no API key is configured, fall back to mock provider
  const finalProviderId = providerConfig.apiKey ? providerId : 'mock';
  const finalProviderConfig = providerConfig.apiKey ? providerConfig : settings.providers?.mock || {};
  
  const system = settings.prompts?.chat || PROMPTS.chat.template;

  const userPrompt = [
    'Selected text:',
    `"""${trimmedSelection}"""`,
    '',
    'Instruction:',
    instruction.trim() || 'Improve the writing while preserving meaning.',
    '',
    'Respond with the updated text only unless additional formatting is requested.'
  ].join('\n');

  console.log('🚀 About to call provider:', {
    provider: finalProviderId,
    hasApiKey: !!finalProviderConfig.apiKey,
    model: finalProviderConfig.model,
    userPromptLength: userPrompt.length
  });

  try {
    const response = await callProvider(finalProviderId, {
      apiKey: finalProviderConfig.apiKey,
      model: finalProviderConfig.model,
      system,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.5,
      maxTokens: 600,
      action: 'selection',
      selection: trimmedSelection
    });

    console.log('✅ Provider response received:', {
      provider: finalProviderId,
      textLength: response.text?.length || 0,
      hasResponse: !!response.text
    });

    return {
      text: response.text,
      provider: finalProviderId,
      model: model,
      raw: response.raw
    };
  } catch (error) {
    console.error('❌ Provider call failed:', {
      provider: finalProviderId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function handleChatFollowup(message) {
  const { selection = '', instruction = '', context = [], model = 'gemini' } = message;
  const trimmedSelection = selection.trim();
  
  if (!trimmedSelection) {
    throw new Error('No text selected.');
  }
  
  if (!instruction.trim()) {
    throw new Error('Please provide a follow-up question or instruction.');
  }

  const settings = await loadSettings();
  
  // Map model names to provider IDs
  const modelToProvider = {
    'gemini': 'gemini',
    'claude': 'anthropic', 
    'gpt': 'openai'
  };
  
  const providerId = modelToProvider[model] || settings.provider || 'gemini';
  const providerConfig = settings.providers?.[providerId] || {};
  
  // If no API key is configured, fall back to mock provider
  const finalProviderId = providerConfig.apiKey ? providerId : 'mock';
  const finalProviderConfig = providerConfig.apiKey ? providerConfig : settings.providers?.mock || {};
  
  const system = settings.prompts?.chat || PROMPTS.chat.template;

  // Build conversation history
  const messages = [
    {
      role: 'user',
      content: `Selected text: """${trimmedSelection}"""`
    },
    ...context,
    {
      role: 'user', 
      content: instruction.trim()
    }
  ];

  const response = await callProvider(finalProviderId, {
    apiKey: finalProviderConfig.apiKey,
    model: finalProviderConfig.model,
    system,
    messages,
    temperature: 0.6,
    maxTokens: 600,
    action: 'chat-followup',
    selection: trimmedSelection
  });

  return {
    text: response.text,
    provider: finalProviderId,
    model: model,
    raw: response.raw
  };
}

function fillTemplate(template = '', vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : `{${key}}`));
}

async function ensureContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'wandpen-rewrite',
      title: 'WandPen: Rewrite selection',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'wandpen-fix-grammar',
      title: 'WandPen: Fix grammar',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'wandpen-open-chat',
      title: 'WandPen: Open chat',
      contexts: ['all']
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === 'wandpen-open-chat' || info.menuItemId === 'lekhak-open-chat') {
    chrome.tabs.sendMessage(tab.id, { type: 'wandpen:toggle-chat', source: 'context-menu' });
    return;
  }
  const action = (info.menuItemId === 'wandpen-rewrite' || info.menuItemId === 'lekhak-rewrite') ? 'rewrite' : 'grammar';
  chrome.tabs.sendMessage(tab.id, {
    type: 'wandpen:context-action',
    action
  });
});
