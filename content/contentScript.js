(async () => {
  console.log('🚀 Lekhak content script starting to load...');
  
  if (window.__wandpenInjected) {
    console.log('⚠️ Lekhak already injected, skipping');
    return;
  }
  
  window.__wandpenInjected = true;
  console.log('✅ Lekhak content script injected successfully');

  // Constants
  const CONSTANTS = {
    REOPEN_DELAY: 300,
    CLOSE_DELAY: 500,
    SELECTION_DEBOUNCE: 100,
    SCROLL_THROTTLE: 100,
    RESIZE_DEBOUNCE: 150,
    DOUBLE_CLICK_WINDOW: 500, // Reduced from 1000ms
    MESSAGE_TIMEOUT: 30000, // 30 seconds
    SUPPRESS_DELAY: 300,
    SUPPRESS_LONG_DELAY: 600,
    MARGIN: 12,
    BADGE_SIZE: 36,
    PANEL_WIDTH: 350,
    PANEL_HEIGHT: 235,
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  };

  // Enhanced badge CSS with better design
  const BADGE_CSS = `
    :host { all: initial; }
    .badge-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 2147483646;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .badge-wrapper.visible {
      pointer-events: auto;
    }
    .badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: scale(0);
      opacity: 0;
    }
    .badge-wrapper.visible .badge {
      transform: scale(1);
      opacity: 1;
      animation: badgeAppear 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    @keyframes badgeAppear {
      0% {
        transform: scale(0) rotate(-180deg);
        opacity: 0;
      }
      50% {
        transform: scale(1.1) rotate(10deg);
      }
      100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
      }
    }
    .badge:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5), 0 3px 6px rgba(0, 0, 0, 0.15);
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    }
    .badge:active {
      transform: scale(0.95);
    }
    .badge-icon {
      width: 20px;
      height: 20px;
      color: white;
      font-weight: bold;
      font-size: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .badge::before {
      content: '';
      position: absolute;
      inset: -2px;
      background: linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c);
      border-radius: 50%;
      z-index: -1;
      opacity: 0;
      transition: opacity 0.3s ease;
      animation: rotate 3s linear infinite;
      filter: blur(8px);
    }
    .badge:hover::before {
      opacity: 0.6;
    }
    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .badge-tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-8px);
      background: #1f2937;
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }
    .badge:hover .badge-tooltip {
      opacity: 1;
    }
    .badge-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: #1f2937;
    }
  `;

  const PANEL_CSS = `
    :host { all: initial; }
    
    /* CSS Variables for theming */
    .panel {
      --bg-primary: white;
      --bg-secondary: #f9fafb;
      --bg-tertiary: #e5e7eb;
      --text-primary: #111827;
      --text-secondary: #6b7280;
      --text-tertiary: #9ca3af;
      --border-primary: rgba(204, 208, 213, 1);
      --border-secondary: #e5e7eb;
      --accent-primary: #753fea;
      --accent-hover: #6233d4;
      --shadow-color: rgba(117, 63, 234, 0.3);
    }
    
    .panel.dark-theme {
      --bg-primary: #1f2937;
      --bg-secondary: #1f2937;
      --bg-tertiary: #374151;
      --text-primary: white;
      --text-secondary: #e5e7eb;
      --text-tertiary: #9ca3af;
      --border-primary: #374151;
      --border-secondary: #374151;
      --accent-primary: #3b82f6;
      --accent-hover: #2563eb;
      --shadow-color: rgba(59, 130, 246, 0.3);
    }
    
    .panel {
      position: fixed;
      top: 0;
      left: 0;
      width: 350px;
      height: 235px;
      background: var(--bg-primary);
      border-radius: 16px;
      box-shadow: 0 4px 12px var(--shadow-color), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid var(--border-primary);
      display: none;
      flex-direction: column;
      z-index: 2147483647;
      transform: scale(0.95);
      opacity: 0;
      transition: all 230ms cubic-bezier(0.4, 0, 0.2, 1);
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      color: var(--text-primary);
      overflow: visible; /* Allow absolute positioned children to show */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .panel.visible {
      display: flex;
      opacity: 1;
      transform: scale(1);
    }
    
    /* Theme Toggle */
    .theme-toggle {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 36px;
      height: 20px;
      border: none;
      background: var(--bg-tertiary);
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      transition: all 0.3s ease;
      z-index: 20;
      padding: 2px;
      pointer-events: auto;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .theme-toggle.dark {
      justify-content: flex-end;
    }
    
    .theme-toggle-icon {
      width: 16px;
      height: 16px;
      background: var(--bg-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-size: 8px;
    }
    
    .theme-toggle:hover {
      transform: scale(1.05);
    }
    
    .panel.show {
      animation: panelFadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    .panel.hide {
      animation: panelFadeOut 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes panelFadeIn {
      0% {
        opacity: 0;
        transform: scale(0.92) translateY(-8px);
      }
      60% {
        opacity: 0.8;
        transform: scale(0.98) translateY(-2px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    @keyframes panelFadeOut {
      0% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      100% {
        opacity: 0;
        transform: scale(0.92) translateY(-8px);
      }
    }
    
    /* Search Section - REMOVED */

    /* Menu Section */
    .menu-section {
      flex: 1;
      overflow-y: visible;
      padding: 4px 8px;
    }
    
    .panel {
      max-height: 80vh;
      overflow-y: auto;
    }

    .menu-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
      text-align: left;
      font-size: 12px;
      font-family: inherit;
      color: var(--text-primary);
      margin-bottom: 1px;
      pointer-events: auto;
      position: relative;
      z-index: 1;
    }

    .menu-item:hover {
      background-color: rgba(117, 63, 234, 0.05);
    }
    
    .menu-item:active {
      background-color: rgba(117, 63, 234, 0.15);
      transform: scale(0.98);
    }

    .menu-item.active {
      background-color: rgba(117, 63, 234, 0.1);
      color: var(--accent-primary);
    }
    
    .menu-item.active .menu-icon {
      color: var(--accent-primary);
    }

    .menu-icon {
      width: 14px;
      height: 14px;
      color: var(--text-secondary);
      flex-shrink: 0;
    }

    .menu-item span {
      color: var(--text-primary);
      font-weight: 400;
    }
    
    /* Footer Section */
    .footer-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 16px;
      background: var(--bg-primary);
      border-radius: 0 0 16px 16px;
      flex-shrink: 0;
    }

    .footer-empty {
      color: var(--text-tertiary);
      font-size: 14px;
    }

    .model-selector {
      display: flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 14px;
      font-family: inherit;
      transition: color 0.2s;
    }

    .model-selector:hover {
      color: var(--text-primary);
    }

    .chevron-icon {
      width: 14px;
      height: 14px;
    }
    
    .custom-prompt {
      display: none;
      flex-direction: column;
      gap: 10px;
      padding: 12px;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-secondary);
    }
    
    .custom-prompt.visible {
      display: flex;
    }
    
    .custom-input {
      border: 1px solid var(--border-secondary);
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
      background: var(--bg-primary);
      color: var(--text-primary);
      transition: all 150ms ease;
      resize: vertical;
      min-height: 60px;
      font-family: inherit;
    }
    
    .custom-input:focus {
      outline: none;
      border-color: var(--text-secondary);
    }
    
    .custom-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    
    .btn-secondary {
      padding: 6px 12px;
      border: 1px solid var(--border-secondary);
      border-radius: 6px;
      background: var(--bg-primary);
      color: var(--text-secondary);
      font-size: 11px;
      cursor: pointer;
      transition: all 150ms ease;
      font-family: inherit;
      pointer-events: auto;
      position: relative;
      z-index: 2;
    }
    
    .btn-secondary:hover {
      background: var(--bg-secondary);
    }
    
    .btn-primary {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      background: var(--accent-primary);
      color: white;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 230ms ease;
      font-family: inherit;
      pointer-events: auto;
      position: relative;
      z-index: 2;
    }
    
    .btn-primary:hover {
      background: var(--accent-hover);
    }
    
    .btn-primary:active {
      background: var(--accent-hover);
      transform: scale(0.96);
    }
    
    .btn-secondary:active {
      background: var(--bg-tertiary);
      transform: scale(0.96);
    }
    
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .result-container {
      display: none;
      flex-direction: column;
      gap: 12px;
      background: var(--bg-secondary);
      border-radius: 8px;
      padding: 12px;
      border: 1px solid var(--border-secondary);
      margin: 8px;
    }
    
    .result-container.visible {
      display: flex;
    }
    
    .result-text {
      font-size: 11px;
      line-height: 1.4;
      color: var(--text-primary);
      max-height: 80px;
      overflow-y: auto;
      white-space: pre-wrap;
      font-family: inherit;
    }
    
    .result-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 8px;
    }
    
    .status {
      margin: 8px 0 0;
      font-size: 11px;
      color: var(--text-secondary);
      padding: 0 16px;
      font-family: inherit;
    }

    .status.error {
      color: #dc2626;
    }
    
    .loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      font-size: 11px;
      font-family: inherit;
    }
    
    .spinner {
      width: 12px;
      height: 12px;
      border: 2px solid var(--border-secondary);
      border-top: 2px solid var(--text-secondary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Glass Blur Loading Overlay */
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 16px;
    }
    
    .loading-overlay.visible {
      pointer-events: auto;
    }
    
    .panel.dark-theme .loading-overlay {
      background: rgba(31, 41, 55, 0.9);
    }
    
    .loading-overlay.visible {
      opacity: 1;
      visibility: visible;
    }
    
    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(55, 65, 81, 0.2);
      border-top: 3px solid var(--text-secondary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    /* Settings notification */
    .settings-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 2147483648;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
    }
    
    .settings-notification.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  // Enhanced state management
  const state = {
    badge: null,
    panel: null,
    chat: null,
    selectionText: '',
    selectionRange: null,
    selectionEditable: null,
    selectionRect: null,
    suppressSelectionUpdates: false,
    lastCloseTime: 0,
    lastSelectionTime: 0,
    selectionDebounceTimer: null,
    scrollRAF: null,
    resizeRAF: null,
    isDarkTheme: false,
    debug: true, // Enable debug mode to help troubleshoot button issues
    mousePosition: { x: 0, y: 0 },
    lastDoubleClickTarget: null,
    lastDoubleClickTime: 0,
    eventListeners: [], // Track listeners for cleanup
    isCleanedUp: false,
    cursorPositionCache: new Map() // Cache for cursor positions
  };

  // Check extension context dynamically
  function isExtensionContextValid() {
    try {
      return typeof chrome !== 'undefined' && 
             chrome.runtime && 
             chrome.runtime.id && 
             chrome.storage && 
             chrome.storage.sync;
    } catch (error) {
      return false;
    }
  }
  
  // Helper function to validate if selection text is meaningful
  function isValidSelection(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    // Remove whitespace and check length
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return false;
    }
    
    // Filter out placeholder texts
    const placeholderTexts = [
      '[Empty field - ready for input]',
      '[Cursor position - ready for assistance]',
      'Ready for input',
      'Ready for assistance',
      'Select text to get started'
    ];
    
    if (placeholderTexts.includes(trimmed)) {
      return false;
    }
    
    // Check if it's just brackets or system text
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return false;
    }
    
    // Minimum meaningful length (at least 2 characters)
    if (trimmed.length < 2) {
      return false;
    }
    
    if (state.debug) {
      console.log('✅ Valid selection:', trimmed.substring(0, 50) + (trimmed.length > 50 ? '...' : ''));
    }
    
    return true;
  }

  // Utility functions
  const utils = {
    debounce(func, wait, immediate) {
      let timeout;
      return function executedFunction(...args) {
        const context = this;
        const later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    },
    
    throttle(func, limit) {
      let inThrottle;
      let lastResult;
      return function(...args) {
        const context = this;
        if (!inThrottle) {
          lastResult = func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
        return lastResult;
      }
    },
    
    async loadSettings() {
      if (!isExtensionContextValid()) {
        if (state.debug) console.log('📝 Using fallback settings (not in extension context)');
        return { theme: 'light', model: 'gemini' };
      }
      
      try {
        const result = await chrome.storage.sync.get(['wandpen_theme', 'wandpen_model']);
        return {
          theme: result.wandpen_theme || 'light',
          model: result.wandpen_model || 'gemini'
        };
      } catch (error) {
        console.warn('Failed to load settings:', error);
        return { theme: 'light', model: 'gemini' };
      }
    },
    
    async saveSettings(settings) {
      if (!isExtensionContextValid()) {
        if (state.debug) console.log('📝 Settings not saved (not in extension context)');
        this.showSettingsNotification('Settings saved locally only (extension context unavailable)');
        return;
      }
      
      try {
        await chrome.storage.sync.set({
          wandpen_theme: settings.theme,
          wandpen_model: settings.model
        });
        if (state.debug) console.log('📝 Settings saved successfully');
      } catch (error) {
        console.warn('Failed to save settings:', error);
        this.showSettingsNotification('Failed to save settings. They will not persist.');
      }
    },
    
    showSettingsNotification(message) {
      const notification = document.createElement('div');
      notification.className = 'settings-notification';
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => notification.classList.add('visible'), 10);
      setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },
    
    async sendMessage(message, retryCount = 0) {
      if (state.debug) {
        console.log('🚀 sendMessage called with:', message);
      }
      
      // Check extension context
      if (!isExtensionContextValid()) {
        console.error('❌ Extension context invalidated');
        if (state.debug) {
          return await this.getMockResponse(message);
        }
        throw new Error('Extension disconnected. Please refresh the page.');
      }
      
      return new Promise(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Request timed out. Please try again.'));
        }, CONSTANTS.MESSAGE_TIMEOUT);
        
        try {
          if (state.debug) console.log('📤 Sending message to background script...');
          const startTime = Date.now();
          
          const response = await chrome.runtime.sendMessage(message);
          clearTimeout(timeoutId);
          
          const duration = Date.now() - startTime;
          if (state.debug) console.log(`📥 Received response in ${duration}ms:`, response);
          
          if (!response) {
            throw new Error('No response from background script');
          }
          
          if (response.error) {
            // Handle specific Gemini errors more gracefully
            if (response.error.includes('content might have been filtered')) {
              throw new Error('Content was filtered by Gemini. Please try rephrasing your text or use a different selection.');
            } else if (response.error.includes('Empty response from Gemini')) {
              throw new Error('No response received. This might be due to content filtering or temporary service issues. Please try again.');
            } else {
              throw new Error(response.error);
            }
          }
          
          resolve(response);
          
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('❌ Failed to send message:', error);
          
          // Check if context was invalidated
          if (error.message.includes('Extension context invalidated') || 
              error.message.includes('message port closed') ||
              !isExtensionContextValid()) {
            
            // Retry with exponential backoff
            if (retryCount < CONSTANTS.MAX_RETRY_ATTEMPTS) {
              const delay = CONSTANTS.RETRY_DELAY * Math.pow(2, retryCount);
              console.log(`🔄 Retrying in ${delay}ms... (attempt ${retryCount + 1})`);
              
              setTimeout(async () => {
                try {
                  const result = await this.sendMessage(message, retryCount + 1);
                  resolve(result);
                } catch (retryError) {
                  reject(retryError);
                }
              }, delay);
              return;
            }
            
            reject(new Error('Extension disconnected. Please refresh the page.'));
            return;
          }
          
          reject(error);
        }
      });
    },

    async getMockResponse(message) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      const { selection = '', instruction = '' } = message;
      const mockResponses = {
        'improve': `${selection}\n\n[✨ Enhanced for clarity and flow]`,
        'grammar': `${selection.replace(/grammer/g, 'grammar').replace(/readibility/g, 'readability')}\n\n[✓ Grammar fixed]`,
        'summarise': `Summary: ${selection.split(' ').slice(0, 10).join(' ')}...\n\n[📝 Key points extracted]`,
        'explain': `Explanation: This text discusses ${selection.toLowerCase().substring(0, 30)}...\n\n[💡 Simplified explanation]`,
        'professional': `${selection.replace(/hey/gi, 'Dear colleague')}\n\n[👔 Professional tone applied]`
      };
      
      let responseText = mockResponses.improve;
      
      if (instruction.includes('grammar')) responseText = mockResponses.grammar;
      else if (instruction.includes('summarise')) responseText = mockResponses.summarise;
      else if (instruction.includes('explain')) responseText = mockResponses.explain;
      else if (instruction.includes('professional')) responseText = mockResponses.professional;
      else if (instruction.includes('improve')) responseText = mockResponses.improve;
      
      return { text: responseText };
    }
  };

  // Initialize components
  state.badge = createEnhancedBadge();
  state.panel = createEnhancedPanel();
  state.chat = await createChatOverlay();
  
  // Initialize mouse position tracking
  const mouseMoveHandler = (event) => {
    state.mousePosition.x = event.clientX + window.scrollX;
    state.mousePosition.y = event.clientY + window.scrollY;
  };
  addEventListener(document, 'mousemove', mouseMoveHandler, { passive: true });
  
  // Double-click enhancement
  const doubleClickHandler = (event) => {
    const target = event.target;
    const tagName = target?.tagName.toLowerCase();
    
    if (tagName === 'textarea' || 
        (tagName === 'input' && /^(?:text|search|password|email|tel|url)$/i.test(target.type))) {
      
      const isEmpty = !target.value || target.value.trim().length === 0;
      const hasSelection = target.selectionStart !== target.selectionEnd;
      
      if (isEmpty || !hasSelection) {
        state.lastDoubleClickTarget = target;
        state.lastDoubleClickTime = Date.now();
        
        target.focus();
        
        setTimeout(() => {
          if (!state.suppressSelectionUpdates && !state.panel.isOpen()) {
            updateSelectionState();
          }
        }, 50);
        
        setTimeout(() => {
          if (state.lastDoubleClickTarget === target) {
            state.lastDoubleClickTarget = null;
            state.lastDoubleClickTime = 0;
          }
        }, CONSTANTS.DOUBLE_CLICK_WINDOW);
        
        if (state.debug) {
          console.log('📱 Double-click on empty field detected:', tagName, 'isEmpty:', isEmpty);
        }
      }
    }
  };
  addEventListener(document, 'dblclick', doubleClickHandler);
  
  if (state.debug) {
    console.log('✨ Lekhak Phase 1 Enhancements Active');
  }
  
  // Load saved preferences
  const savedSettings = await utils.loadSettings();
  state.isDarkTheme = savedSettings.theme === 'dark';
  if (state.panel) {
    state.panel.setModel(savedSettings.model);
    state.panel.setTheme(state.isDarkTheme);
  }

  // Badge click handler
  state.badge.onClick(() => {
    // Capture selection immediately to prevent corruption
    const capturedText = state.selectionText;
    const capturedRect = state.selectionRect;
    
    if (capturedText && capturedRect) {
      if (state.debug) {
        console.log('Badge onClick with captured text:', capturedText?.substring(0, 50) + '...');
      }
      state.panel.open(capturedRect, capturedText);
    }
  });

  // Panel event handlers
  state.panel.onCancel(() => {
    state.panel.close();
    state.badge.hide();
    state.lastCloseTime = Date.now();
  });

  state.panel.onSubmit(async (instruction) => {
    if (!state.selectionText) {
      state.panel.showError('Select text first to send a request.');
      return;
    }
    state.panel.setLoading(true, 'Processing...');
    try {
      const response = await utils.sendMessage({
        type: 'wandpen:selection-chat',
        selection: state.selectionText,
        instruction: instruction || ''
      });
      if (response?.error) throw new Error(response.error);
      const text = response.text || '';
      state.panel.showResult(text);
    } catch (error) {
      state.panel.showError(error.message || 'Something went wrong.');
    } finally {
      state.panel.setLoading(false);
    }
  });

  state.panel.onInsert((text) => {
    applyResult(text);
    state.panel.close();
    state.badge.hide();
  });

  state.panel.onCopy(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      state.panel.showStatus('Copied to clipboard.');
    } catch (error) {
      state.panel.showError('Clipboard blocked. Copy manually.');
    }
  });

  // Selection detection with debouncing
  const handleSelectionChange = utils.debounce(() => {
    if (state.suppressSelectionUpdates || state.panel.isOpen()) {
      return;
    }
    
    const timeSinceClose = Date.now() - state.lastCloseTime;
    if (timeSinceClose < CONSTANTS.REOPEN_DELAY) {
      return;
    }
    
    setTimeout(() => {
      if (!state.suppressSelectionUpdates && !state.panel.isOpen()) {
        updateSelectionState();
      }
    }, 50);
  }, CONSTANTS.SELECTION_DEBOUNCE);

  addEventListener(document, 'selectionchange', handleSelectionChange);

  const mouseUpHandler = (event) => {
    const timeSinceClose = Date.now() - state.lastCloseTime;
    
    if (state.panel.isOpen() || timeSinceClose < CONSTANTS.CLOSE_DELAY) return;
    
    const path = event.composedPath();
    if (path.includes(state.badge.getElement()) || 
        path.includes(state.panel.getElement())) {
      return;
    }
    
    setTimeout(() => {
      if (!state.suppressSelectionUpdates && !state.panel.isOpen()) {
        handleSelectionChange();
      }
    }, 100);
  };
  addEventListener(document, 'mouseup', mouseUpHandler);

  // Enhanced keyboard selection detection
  const keyUpHandler = (event) => {
    const selectionKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
                          'Home', 'End', 'PageUp', 'PageDown'];
    const isSelectionKey = event.shiftKey && selectionKeys.includes(event.key);
    const isSelectAllKey = (event.ctrlKey || event.metaKey) && event.key === 'a';
    
    if (isSelectionKey || isSelectAllKey) {
      if (!state.suppressSelectionUpdates && !state.panel.isOpen()) {
        handleSelectionChange();
      }
    }
  };
  addEventListener(document, 'keyup', keyUpHandler);

  // Scroll handling with RAF and throttling
  const handleScroll = utils.throttle(() => {
    if (state.scrollRAF) cancelAnimationFrame(state.scrollRAF);
    
    state.scrollRAF = requestAnimationFrame(() => {
      if (state.badge.isVisible() && !state.badge.isExpanded() && state.selectionRect) {
        const updatedRect = recalculateSelectionRect();
        if (updatedRect) {
          state.selectionRect = updatedRect;
          state.badge.updatePosition(updatedRect);
        } else {
          state.badge.hide();
        }
      }
      
      if (state.panel.isOpen() && state.selectionRect) {
        const updatedRect = recalculateSelectionRect();
        if (updatedRect) {
          state.selectionRect = updatedRect;
          state.panel.updatePosition(updatedRect);
        }
      }
    });
  }, CONSTANTS.SCROLL_THROTTLE);

  addEventListener(window, 'scroll', handleScroll, { passive: true });

  // Resize handling
  const handleResize = utils.debounce(() => {
    if (state.resizeRAF) cancelAnimationFrame(state.resizeRAF);
    
    state.resizeRAF = requestAnimationFrame(() => {
      if (state.panel.isOpen() && state.selectionRect) {
        state.panel.updatePosition(state.selectionRect);
      }
      
      if (state.badge.isVisible() && state.selectionRect) {
        state.badge.updatePosition(state.selectionRect);
      }
    });
  }, CONSTANTS.RESIZE_DEBOUNCE);

  addEventListener(window, 'resize', handleResize);

  // Message handler for commands
  const messageHandler = (message) => {
    if (!message?.type) return;
    
    switch(message.type) {
      case 'wandpen:toggle-chat':
        state.chat.toggle();
        break;
        
      case 'wandpen:context-action':
        if (!captureCurrentSelection()) return;
        const preset = message.action === 'grammar' 
          ? 'Fix grammar, spelling, and clarity.' 
          : 'Rewrite for clarity and conciseness.';
        state.panel.open(state.selectionRect, state.selectionText, preset);
        break;
    }
  };
  
  if (isExtensionContextValid()) {
    chrome.runtime.onMessage.addListener(messageHandler);
  }

  // Chat message handler
  state.chat.onSend(async (prompt) => {
    if (!prompt.trim()) return;
    const history = state.chat.getHistory();
    state.chat.pushMessage({ role: 'user', content: prompt });
    state.chat.setLoading(true);
    
    try {
      const response = await utils.sendMessage({
        type: 'wandpen:chat-message',
        history,
        prompt
      });
      if (response?.error) throw new Error(response.error);
      state.chat.pushMessage({ role: 'assistant', content: response.text || '' });
    } catch (error) {
      state.chat.pushMessage({ 
        role: 'assistant', 
        content: `Error: ${error.message}` 
      });
    } finally {
      state.chat.setLoading(false);
    }
  });

  // Cleanup function
  function cleanup() {
    if (state.isCleanedUp) return;
    
    state.isCleanedUp = true;
    
    // Remove all event listeners
    state.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    state.eventListeners = [];
    
    // Cancel any pending animations
    if (state.scrollRAF) cancelAnimationFrame(state.scrollRAF);
    if (state.resizeRAF) cancelAnimationFrame(state.resizeRAF);
    if (state.selectionDebounceTimer) clearTimeout(state.selectionDebounceTimer);
    
    // Clear cache
    state.cursorPositionCache.clear();
    
    if (state.debug) console.log('🧹 Cleanup completed');
  }
  
  // Helper to track event listeners
  function addEventListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    state.eventListeners.push({ element, event, handler, options });
  }

  // Listen for page unload to cleanup
  addEventListener(window, 'beforeunload', cleanup);

  // Expose state for debugging
  if (state.debug) {
    window.__wandpenState = state;
    window.__wandpenCleanup = cleanup;
  }

  function updateSelectionState() {
    const timeSinceClose = Date.now() - state.lastCloseTime;
    
    if (timeSinceClose < CONSTANTS.REOPEN_DELAY) {
      return;
    }
    
    // Don't update selection if panel is open to prevent corruption
    if (state.panel && state.panel.isOpen()) {
      if (state.debug) {
        console.log('⏸️ Skipping selection update - panel is open');
      }
      return;
    }
    
    if (state.badge.isVisible()) {
      return;
    }
    
    if (captureCurrentSelection()) {
      setTimeout(() => {
        if (!state.suppressSelectionUpdates && !state.panel.isOpen()) {
          state.badge.show(state.selectionRect);
        }
      }, 100);
    } else {
      state.badge.hide();
    }
  }

  function captureCurrentSelection() {
    const activeElement = document.activeElement;
    const tagName = activeElement?.tagName.toLowerCase();
    
    let text = '';
    let rect = null;
    let range = null;
    let editable = null;
    
    // Handle input fields and textareas with precise cursor positioning
    if (tagName === 'textarea' || 
        (tagName === 'input' && /^(?:text|search|password|email|tel|url)$/i.test(activeElement.type))) {
      
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const isRecentDoubleClick = state.lastDoubleClickTarget === activeElement && 
                                  (Date.now() - state.lastDoubleClickTime) < CONSTANTS.DOUBLE_CLICK_WINDOW;
      
      if (start !== null && end !== null && start !== end) {
        text = activeElement.value.slice(start, end);
        
        if (text && text.trim()) {
          // Use the selection start position for positioning, not end
          const startPos = getCursorXY(activeElement, start);
          const endPos = getCursorXY(activeElement, end);
          const elementRect = activeElement.getBoundingClientRect();
          
          // Calculate width of selected text for better positioning
          const selectionWidth = Math.abs(endPos.x - startPos.x) || 2;
          
          rect = {
            left: startPos.x,
            top: startPos.y,
            width: selectionWidth,
            height: elementRect.height,
            right: startPos.x + selectionWidth,
            bottom: startPos.y + elementRect.height
          };
          
          editable = activeElement;
          
          if (state.debug) {
            console.log('✨ Enhanced input detection:', {
              tagName,
              selectedText: text,
              start,
              end,
              textLength: text.length
            });
          }
        }
      }
      else if (isRecentDoubleClick && activeElement === document.activeElement) {
        const isEmpty = !activeElement.value || activeElement.value.trim().length === 0;
        
        if (isEmpty || start === end) {
          // For empty fields, show badge but don't capture placeholder text
          text = ''; // Don't use placeholder text that confuses the LLM
          
          const cursorPos = start !== null ? getCursorXY(activeElement, start) : 
                           { x: activeElement.getBoundingClientRect().left + 5, 
                             y: activeElement.getBoundingClientRect().top + 5 };
          const elementRect = activeElement.getBoundingClientRect();
          
          rect = {
            left: cursorPos.x,
            top: cursorPos.y,
            width: 2,
            height: elementRect.height,
            right: cursorPos.x + 2,
            bottom: cursorPos.y + elementRect.height
          };
          
          editable = activeElement;
          
          if (state.debug) {
            console.log('📱 Double-click empty field - badge will show but no text captured');
          }
        }
      }
    }
    
    // Fallback to regular text selection
    if (!text) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        state.selectionText = '';
        state.selectionRect = null;
        return false;
      }
      
      text = selection.toString();
      if (!text || !text.trim()) {
        state.selectionText = '';
        state.selectionRect = null;
        return false;
      }
      
      range = selection.getRangeAt(0).cloneRange();
      rect = getAccurateBoundingRect(range);
      editable = closestEditable(selection.anchorNode);
    }

    if (!rect || (rect.width === 0 && rect.height === 0)) {
      state.selectionText = '';
      state.selectionRect = null;
      return false;
    }
    
    const normalizedRect = normaliseRect(rect);
    if (!normalizedRect) {
      state.selectionText = '';
      state.selectionRect = null;
      return false;
    }

    // Store the selection, but validate it first
    const trimmedText = text.trim();
    state.selectionText = trimmedText;
    state.selectionRange = range;
    state.selectionEditable = editable;
    state.selectionRect = normalizedRect;
    state.lastSelectionTime = Date.now();
    
    if (state.debug) {
      console.log('📝 Text captured:', {
        original: text,
        trimmed: trimmedText,
        length: trimmedText.length,
        isValid: isValidSelection(trimmedText),
        preview: trimmedText.substring(0, 100) + (trimmedText.length > 100 ? '...' : ''),
        fullText: trimmedText
      });
    }
    
    return true;
  }

  function recalculateSelectionRect() {
    if (!state.selectionRange) return null;
    
    try {
      const rect = getAccurateBoundingRect(state.selectionRange);
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        return null;
      }
      return normaliseRect(rect);
    } catch (error) {
      return null;
    }
  }

  // Optimized cursor position calculation with caching
  function getCursorXY(element, position) {
    const cacheKey = `${element.id || element.name}-${position}`;
    
    if (state.cursorPositionCache.has(cacheKey)) {
      const cached = state.cursorPositionCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 1000) {
        return cached.position;
      }
    }
    
    const { offsetLeft, offsetTop } = element;
    const tempDiv = document.createElement('div');
    const computedStyle = getComputedStyle(element);
    
    // Critical styles only for performance
    const criticalStyles = [
      'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing',
      'lineHeight', 'padding', 'border', 'boxSizing'
    ];
    
    criticalStyles.forEach(prop => {
      tempDiv.style[prop] = computedStyle[prop];
    });
    
    const text = element.tagName === 'INPUT' ? 
      element.value.replace(/ /g, '.') : element.value;
    const textBeforeCursor = text.substr(0, position);
    
    tempDiv.textContent = textBeforeCursor;
    
    if (element.tagName === 'TEXTAREA') {
      tempDiv.style.height = 'auto';
    }
    if (element.tagName === 'INPUT') {
      tempDiv.style.width = 'auto';
    }
    
    const measureSpan = document.createElement('span');
    measureSpan.textContent = text.substr(position) || '.';
    tempDiv.appendChild(measureSpan);
    
    tempDiv.style.cssText += 'position:absolute;visibility:hidden;pointer-events:none;z-index:-1000;';
    document.body.appendChild(tempDiv);
    
    const { offsetLeft: spanLeft, offsetTop: spanTop } = measureSpan;
    document.body.removeChild(tempDiv);
    
    const result = {
      x: offsetLeft + spanLeft,
      y: offsetTop + spanTop
    };
    
    // Cache result
    state.cursorPositionCache.set(cacheKey, {
      position: result,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (state.cursorPositionCache.size > 50) {
      const firstKey = state.cursorPositionCache.keys().next().value;
      state.cursorPositionCache.delete(firstKey);
    }
    
    return result;
  }

  function getAccurateBoundingRect(range) {
    let rect = range.getBoundingClientRect();
    
    if (rect && rect.width > 0 && rect.height > 0) {
      return rect;
    }
    
    const rects = range.getClientRects();
    if (rects && rects.length > 0) {
      let combinedRect = rects[0];
      
      if (rects.length > 1) {
        let minX = combinedRect.left, minY = combinedRect.top;
        let maxX = combinedRect.right, maxY = combinedRect.bottom;
        
        for (let i = 1; i < rects.length; i++) {
          const r = rects[i];
          minX = Math.min(minX, r.left);
          minY = Math.min(minY, r.top);
          maxX = Math.max(maxX, r.right);
          maxY = Math.max(maxY, r.bottom);
        }
        
        combinedRect = {
          left: minX,
          top: minY,
          right: maxX,
          bottom: maxY,
          width: maxX - minX,
          height: maxY - minY
        };
      }
      
      return combinedRect;
    }
    
    const container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
      return container.parentElement.getBoundingClientRect();
    } else if (container.nodeType === Node.ELEMENT_NODE) {
      return container.getBoundingClientRect();
    }
    
    return null;
  }

  function applyResult(newText) {
    if (!newText) return;
    const editable = state.selectionEditable;
    
    if (editable && typeof editable.value === 'string' && 'setRangeText' in editable) {
      const start = editable.selectionStart ?? 0;
      const end = editable.selectionEnd ?? 0;
      editable.setRangeText(newText, start, end, 'end');
      editable.dispatchEvent(new Event('input', { bubbles: true }));
      editable.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (state.selectionRange) {
      const range = state.selectionRange;
      const textNode = document.createTextNode(newText);
      range.deleteContents();
      range.insertNode(textNode);
      const selection = window.getSelection();
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(textNode);
      newRange.collapse(true);
      selection.addRange(newRange);
      dispatchInputEvent(textNode.parentElement || textNode);
    }
    
    state.selectionRange = null;
    state.selectionEditable = null;
    state.selectionText = '';
  }

  function dispatchInputEvent(node) {
    if (!node) return;
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!element) return;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function closestEditable(node) {
    if (!node) return null;
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    while (el) {
      if (el.isContentEditable) return el;
      if (el.tagName === 'TEXTAREA') return el;
      if (el.tagName === 'INPUT' && /^(text|search|email|tel|url)$/i.test(el.type)) {
        return el;
      }
      el = el.parentElement;
    }
    return document.activeElement;
  }

  function normaliseRect(rect) {
    if (!rect) return null;
    if (rect.width === 0 && rect.height === 0) return null;
    
    const top = typeof rect.top === 'number' ? rect.top : 0;
    const left = typeof rect.left === 'number' ? rect.left : 0;
    const width = typeof rect.width === 'number' ? rect.width : 0;
    const height = typeof rect.height === 'number' ? rect.height : 0;
    
    return {
      top: top + window.scrollY,
      left: left + window.scrollX,
      width: width,
      height: height,
      bottom: top + height + window.scrollY,
      right: left + width + window.scrollX
    };
  }

  function calculateSmartPosition(rect, elementWidth, elementHeight) {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
    
    // Center above selection when possible
    let left = rect.left + (rect.width / 2) - (elementWidth / 2);
    let top = rect.top - elementHeight - CONSTANTS.MARGIN;
    
    const viewportRight = viewport.scrollX + viewport.width;
    const viewportBottom = viewport.scrollY + viewport.height;
    
    // Horizontal bounds
    if (left + elementWidth > viewportRight - CONSTANTS.MARGIN) {
      left = viewportRight - elementWidth - CONSTANTS.MARGIN;
    }
    if (left < viewport.scrollX + CONSTANTS.MARGIN) {
      left = viewport.scrollX + CONSTANTS.MARGIN;
    }
    
    // Vertical positioning with intelligent fallback
    if (top < viewport.scrollY + CONSTANTS.MARGIN) {
      const spaceBelow = viewportBottom - rect.bottom;
      if (spaceBelow >= elementHeight + CONSTANTS.MARGIN) {
        top = rect.bottom + CONSTANTS.MARGIN;
      } else {
        const spaceAbove = rect.top - viewport.scrollY;
        if (spaceAbove > spaceBelow) {
          top = Math.max(viewport.scrollY + CONSTANTS.MARGIN, 
                        rect.top - elementHeight - CONSTANTS.MARGIN);
        } else {
          top = Math.min(rect.bottom + CONSTANTS.MARGIN, 
                        viewportBottom - elementHeight - CONSTANTS.MARGIN);
        }
      }
    }
    
    // Final bounds enforcement
    left = Math.round(Math.max(viewport.scrollX + CONSTANTS.MARGIN, 
                              Math.min(left, viewportRight - elementWidth - CONSTANTS.MARGIN)));
    top = Math.round(Math.max(viewport.scrollY + CONSTANTS.MARGIN, 
                             Math.min(top, viewportBottom - elementHeight - CONSTANTS.MARGIN)));
    
    return { left, top };
  }

  function createEnhancedBadge() {
    const host = document.createElement('div');
    host.id = 'wandpen-badge-host';
    host.style.cssText = 'position: fixed; pointer-events: none; z-index: 2147483647;';
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = BADGE_CSS;
    shadow.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'badge-wrapper';
    wrapper.innerHTML = `
      <div class="badge" role="button" aria-label="Open Lekhak assistant" tabindex="0">
        <div class="badge-icon">L</div>
        <div class="badge-tooltip">Open Lekhak</div>
      </div>
    `;
    shadow.appendChild(wrapper);

    const badge = wrapper.querySelector('.badge');
    let isVisible = false;
    
    const handleBadgeClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      // Capture selection immediately to prevent corruption during timeout
      const capturedText = state.selectionText;
      const capturedRect = state.selectionRect;
      
      if (state.debug) {
        console.log('Badge clicked, opening panel with captured text:', capturedText?.substring(0, 50) + '...');
      }
      
      wrapper.classList.remove('visible');
      isVisible = false;
      
      setTimeout(() => {
        if (capturedText && capturedRect) {
          state.panel.open(capturedRect, capturedText);
        }
      }, 150);
    };
    
    badge.addEventListener('click', handleBadgeClick);
    badge.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        handleBadgeClick(event);
      }
    });

    const handleClickOutside = (event) => {
      if (!isVisible) return;
      
      const path = event.composedPath();
      const isInsideBadge = path.includes(wrapper) || 
                           path.includes(host) || 
                           event.target === host ||
                           event.target.closest('#wandpen-badge-host');
      
      if (!isInsideBadge && !event.target.closest('#wandpen-panel-host')) {
        state.lastCloseTime = Date.now();
        state.suppressSelectionUpdates = true;
        
        wrapper.classList.remove('visible');
        isVisible = false;
        
        setTimeout(() => {
          state.suppressSelectionUpdates = false;
        }, CONSTANTS.SUPPRESS_DELAY);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside, true);

    return {
      show(rect) {
        const position = calculateSmartPosition(rect, CONSTANTS.BADGE_SIZE, CONSTANTS.BADGE_SIZE);
        
        if (state.debug) {
          console.log('Badge positioning:', {
            selection: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
            calculated: position,
            viewport: { scrollX: window.scrollX, scrollY: window.scrollY }
          });
        }
        
        wrapper.style.top = `${position.top}px`;
        wrapper.style.left = `${position.left}px`;
        wrapper.style.transform = 'none';
        
        wrapper.classList.add('visible');
        isVisible = true;
      },
      
      hide() {
        wrapper.classList.remove('visible');
        isVisible = false;
      },
      
      isVisible() {
        return isVisible;
      },
      
      isExpanded() {
        return false; // Badge doesn't expand
      },
      
      getElement() {
        return wrapper;
      },
      
      onClick(fn) {
        badge.addEventListener('click', fn);
      },
      
      updatePosition(rect) {
        if (!isVisible || !rect) return;
        
        const position = calculateSmartPosition(rect, CONSTANTS.BADGE_SIZE, CONSTANTS.BADGE_SIZE);
        
        wrapper.style.top = `${position.top}px`;
        wrapper.style.left = `${position.left}px`;
        wrapper.style.transform = 'none';
      }
    };
  }

  function createEnhancedPanel() {
    const host = document.createElement('div');
    host.id = 'wandpen-panel-host';
    host.style.cssText = 'position: fixed; pointer-events: none; z-index: 2147483647;';
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = PANEL_CSS;
    shadow.appendChild(style);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Lekhak assistant panel');
    panel.innerHTML = `
      <!-- Theme Toggle -->
      <button class="theme-toggle" type="button" aria-label="Toggle dark theme">
        <div class="theme-toggle-icon">☀️</div>
      </button>

      <!-- Menu Items -->
      <div class="menu-section" role="menu">
        <button class="menu-item active" data-action="improve" role="menuitem" aria-label="Improve writing">
          <svg class="menu-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
          </svg>
          <span>Improve writing</span>
        </button>

        <button class="menu-item" data-action="summarise" role="menuitem" aria-label="Summarise text">
          <svg class="menu-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          <span>Summarise</span>
        </button>

        <button class="menu-item" data-action="grammar" role="menuitem" aria-label="Fix grammar">
          <svg class="menu-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          <span>Fix grammar</span>
        </button>

        <button class="menu-item" data-action="explain" role="menuitem" aria-label="Explain text">
          <svg class="menu-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 12l2 2 4-4"></path>
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
          <span>What is this?</span>
        </button>

        <button class="menu-item" data-action="professional" role="menuitem" aria-label="Write professionally">
          <svg class="menu-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <span>Write professionally</span>
        </button>

        <button class="menu-item" data-action="custom" role="menuitem" aria-label="Use custom prompt">
        <svg class="menu-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Use custom prompt:</span>
        </button>
      </div>
      
      <div class="custom-prompt">
        <textarea class="custom-input" placeholder="Enter your custom prompt..." aria-label="Custom prompt input"></textarea>
        <div class="custom-actions">
          <button type="button" class="btn-secondary cancel-custom" aria-label="Cancel custom prompt">Cancel</button>
          <button type="button" class="btn-primary submit-custom" aria-label="Submit custom prompt">Send</button>
        </div>
      </div>
      
      <div class="result-container">
        <div class="result-text" role="region" aria-label="Result text"></div>
        <div class="result-actions">
          <button type="button" class="btn-secondary copy-result" aria-label="Copy result to clipboard">Copy</button>
          <button type="button" class="btn-primary insert-result" aria-label="Insert result into document">Insert</button>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <span class="footer-empty"></span>
        <button class="model-selector" id="model-button" aria-label="Select model">
          <span>gemini</span>
          <svg class="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </button>
      </div>
      
      <!-- Glass Blur Loading Overlay -->
      <div class="loading-overlay" role="status" aria-live="polite">
        <div class="loading-spinner"></div>
      </div>
    `;
    shadow.appendChild(panel);

    // Get all elements
    const menuItems = panel.querySelectorAll('.menu-item');
    const resultContainer = panel.querySelector('.result-container');
    const resultText = panel.querySelector('.result-text');
    const insertBtn = panel.querySelector('.insert-result');
    const copyBtn = panel.querySelector('.copy-result');
    const modelButton = panel.querySelector('#model-button');
    const customPrompt = panel.querySelector('.custom-prompt');
    const customInput = panel.querySelector('.custom-input');
    const submitCustomBtn = panel.querySelector('.submit-custom');
    const cancelCustomBtn = panel.querySelector('.cancel-custom');
    const loadingOverlay = panel.querySelector('.loading-overlay');
    const themeToggle = panel.querySelector('.theme-toggle');
    const themeToggleIcon = panel.querySelector('.theme-toggle-icon');
    
    const statusEl = document.createElement('div');
    statusEl.className = 'status';
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', 'polite');
    panel.appendChild(statusEl);
    
    let insertHandler = () => {};
    let copyHandler = () => {};
    let cancelHandler = () => {};
    let currentModel = 'gemini';
    let chatContext = [];
    let latestResponse = '';
    let isOpen = false;
    
    // Validate all critical elements exist
    function validateElements() {
      const elements = {
        menuItems,
        resultContainer,
        resultText,
        insertBtn,
        copyBtn,
        modelButton,
        customPrompt,
        customInput,
        submitCustomBtn,
        cancelCustomBtn,
        loadingOverlay,
        themeToggle,
        themeToggleIcon
      };
      
      const missing = [];
      Object.entries(elements).forEach(([name, element]) => {
        if (!element || (element.length !== undefined && element.length === 0)) {
          missing.push(name);
        }
      });
      
      if (missing.length > 0) {
        console.error('❌ Missing critical elements:', missing);
        return false;
      }
      
      if (state.debug) {
        console.log('✅ All critical elements found:', Object.keys(elements));
      }
      return true;
    }
    
    // Validate elements before setting up listeners
    if (!validateElements()) {
      console.error('❌ Panel initialization failed - missing elements');
      return null;
    }
    
    // Function to ensure all buttons are responsive
    function ensureButtonsResponsive() {
      if (state.debug) console.log('🔧 Ensuring all buttons are responsive');
      
      // Force enable pointer events on all interactive elements
      menuItems.forEach(btn => {
        if (btn) {
          btn.style.pointerEvents = 'auto';
          btn.style.cursor = 'pointer';
          btn.style.position = 'relative';
          btn.style.zIndex = '1';
        }
      });
      
      [insertBtn, copyBtn, submitCustomBtn, cancelCustomBtn, themeToggle].forEach(btn => {
        if (btn) {
          btn.style.pointerEvents = 'auto';
          btn.style.cursor = 'pointer';
          btn.style.position = 'relative';
          btn.style.zIndex = '2';
        }
      });
      
      // Ensure loading overlay doesn't block when not visible
      if (loadingOverlay && !loadingOverlay.classList.contains('visible')) {
        loadingOverlay.style.pointerEvents = 'none';
      }
      
      if (state.debug) {
        console.log('✅ Button responsiveness ensured');
      }
    }
    
    // Debug function to test button clicks programmatically
    function testButtonClicks() {
      console.log('🧪 Testing button clicks...');
      menuItems.forEach((btn, i) => {
        console.log(`Button ${i}:`, btn.dataset.action, 'clickable:', !btn.disabled, 'visible:', btn.offsetHeight > 0);
      });
    }

    // Functions
    async function handleQuickAction(action) {
      if (state.debug) {
        console.log('🎯 handleQuickAction called:', {
          action,
          selectionText: state.selectionText,
          selectionLength: state.selectionText?.length,
          selectionValid: isValidSelection(state.selectionText)
        });
      }
      
      const prompts = {
        improve: 'Improve the writing quality, clarity, and flow of this text while maintaining its original meaning',
        grammar: 'Fix grammar, spelling, and punctuation errors in this text',
        explain: 'Explain what this text means in simple terms',
        professional: 'Rewrite this text to sound more professional and polished',
        summarise: 'Provide a concise summary of this text'
      };
      
      const prompt = prompts[action];
      if (prompt && isValidSelection(state.selectionText)) {
        if (state.debug) {
          console.log('✅ Valid selection, proceeding with LLM:', state.selectionText);
        }
        await sendToLLM(prompt);
      } else {
        const actionMessages = {
          explain: 'Please select some text that you want me to explain.',
          improve: 'Please select some text to improve.',
          grammar: 'Please select some text to check for grammar errors.',
          professional: 'Please select some text to make more professional.',
          summarise: 'Please select some text to summarize.'
        };
        
        const message = actionMessages[action] || 'Please select some text first.';
        setError(message);
        
        if (state.debug) {
          console.warn('❌ Invalid selection for action:', action, 'Selection:', state.selectionText, 'Type:', typeof state.selectionText);
        }
      }
    }

    async function handleCustomPrompt(prompt) {
      if (state.debug) {
        console.log('🎯 handleCustomPrompt called with:', {
          prompt,
          hasSelection: !!state.selectionText,
          selectionText: state.selectionText?.substring(0, 50) + '...'
        });
      }
      
      if (!prompt) {
        console.warn('❌ No prompt provided to handleCustomPrompt');
        return;
      }
      
      if (!isValidSelection(state.selectionText)) {
        console.warn('❌ No valid text selected for custom prompt');
        setError('Please select some meaningful text first.');
        return;
      }
      
      if (state.debug) console.log('✅ Proceeding with custom prompt');
      customPrompt.classList.remove('visible');
      customInput.value = '';
      await sendToLLM(prompt);
    }

    async function sendToLLM(instruction, retryCount = 0) {
      setLoading(true, retryCount > 0 ? 'Retrying...' : 'Processing...');
      
      // Final validation before sending to LLM
      if (!isValidSelection(state.selectionText)) {
        setLoading(false);
        setError('No valid text selected. Please select some text first.');
        console.warn('❌ sendToLLM called without valid selection:', state.selectionText);
        return;
      }
      
      if (state.debug) {
        console.log('🔍 Debug Info:', {
          hasSelection: !!state.selectionText,
          selectionLength: state.selectionText?.length,
          selectionValid: isValidSelection(state.selectionText),
          instruction,
          model: currentModel,
          retryCount,
          extensionValid: isExtensionContextValid()
        });
      }
      
      try {
        const messagePayload = {
          type: 'wandpen:selection-chat',
          selection: state.selectionText.trim(),
          instruction: instruction,
          model: currentModel
        };
        
        if (state.debug) console.log('📤 Sending message:', messagePayload);
        
        const response = await utils.sendMessage(messagePayload);
        
        if (state.debug) console.log('📥 Received response:', response);
        
        if (response?.error) throw new Error(response.error);
        
        chatContext = [{ role: 'user', content: instruction }];
        chatContext.push({ role: 'assistant', content: response.text || '' });
        latestResponse = response.text || '';
        
        showResult(response.text || '');
        
      } catch (error) {
        console.error('🚨 sendToLLM error:', error);
        
        // Handle content filtering with retry
        if (error.message.includes('content might have been filtered') && retryCount === 0) {
          console.log('🔄 Content filtered, trying with modified prompt...');
          const safeInstruction = `Please help with this text in a professional manner: ${instruction.replace(/\b(explain|analyze|describe)\b/gi, 'review')}`;
          await sendToLLM(safeInstruction, 1);
          return;
        }
        
        // Handle empty response with retry
        if (error.message.includes('Empty response from Gemini') && retryCount === 0) {
          console.log('🔄 Empty response, retrying...');
          setTimeout(() => sendToLLM(instruction, 1), 1000);
          return;
        }
        
        // Show user-friendly error
        let userError = 'Something went wrong. Please try again.';
        if (error.message.includes('filtered')) {
          userError = 'Content was filtered. Please try selecting different text or rephrase your request.';
        } else if (error.message.includes('Extension context invalidated')) {
          userError = 'Extension disconnected. Please refresh the page and try again.';
        } else if (error.message.includes('timed out')) {
          userError = 'Request timed out. Please check your connection and try again.';
        }
        
        showError(userError);
      } finally {
        setLoading(false);
      }
    }

    function setLoading(isLoading, message = '') {
      if (isLoading) {
        loadingOverlay.classList.add('visible');
        loadingOverlay.style.pointerEvents = 'auto';
        loadingOverlay.setAttribute('aria-busy', 'true');
        statusEl.innerHTML = `<div class="loading"><div class="spinner"></div>${message}</div>`;
        statusEl.classList.remove('error');
      } else {
        loadingOverlay.classList.remove('visible');
        loadingOverlay.style.pointerEvents = 'none';
        loadingOverlay.setAttribute('aria-busy', 'false');
        statusEl.innerHTML = '';
        // Re-ensure buttons are responsive after loading
        ensureButtonsResponsive();
      }
    }

    function showResult(text) {
      resultText.textContent = text;
      resultContainer.classList.add('visible');
      statusEl.textContent = 'Result ready';
      statusEl.classList.remove('error');
      
      setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 150);
    }

    function showError(message) {
      statusEl.textContent = message;
      statusEl.classList.add('error');
    }
    
    function setError(message) {
      showError(message);
    }
    
    function clearResult() {
      resultContainer.classList.remove('visible');
      resultText.textContent = '';
      chatContext = [];
      latestResponse = '';
    }

    // Event handlers with enhanced debugging
    if (state.debug) {
      console.log('🔍 Setting up menu item event listeners:', menuItems.length, 'items found');
    }
    
    menuItems.forEach((btn, index) => {
      const action = btn.dataset.action;
      if (state.debug) {
        console.log(`🔘 Setting up listener for button ${index}:`, action, btn);
      }
      
      btn.addEventListener('click', (e) => {
        if (state.debug) {
          console.log('🖱️ Menu item clicked:', action, e.target);
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        // Ensure button is responsive
        btn.style.pointerEvents = 'auto';
        
        menuItems.forEach(item => item.classList.remove('active'));
        btn.classList.add('active');
        
        if (action === 'custom') {
          if (state.debug) console.log('📝 Opening custom prompt');
          customPrompt.classList.add('visible');
          setTimeout(() => customInput.focus(), 100);
        } else {
          if (state.debug) console.log('⚡ Executing quick action:', action);
          handleQuickAction(action);
        }
      });
      
      // Add keyboard support
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });

    if (submitCustomBtn) {
      submitCustomBtn.addEventListener('click', (e) => {
        if (state.debug) console.log('🖱️ Submit custom button clicked');
        e.preventDefault();
        e.stopPropagation();
        submitCustomBtn.style.pointerEvents = 'auto';
        
        const prompt = customInput.value.trim();
        if (state.debug) console.log('📝 Custom input value:', prompt);
        if (prompt) {
          handleCustomPrompt(prompt);
        } else {
          console.warn('❌ Empty prompt, not submitting');
          setError('Please enter a custom prompt');
        }
      });
    } else {
      console.warn('❌ Submit custom button not found');
    }

    if (cancelCustomBtn) {
      cancelCustomBtn.addEventListener('click', (e) => {
        if (state.debug) console.log('🖱️ Cancel custom button clicked');
        e.preventDefault();
        e.stopPropagation();
        cancelCustomBtn.style.pointerEvents = 'auto';
        
        customPrompt.classList.remove('visible');
        customInput.value = '';
      });
    } else {
      console.warn('❌ Cancel custom button not found');
    }

    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          return;
        }
        e.preventDefault();
        const prompt = customInput.value.trim();
        if (prompt) {
          if (state.debug) console.log('🚀 Custom prompt submitted via Enter key:', prompt);
          handleCustomPrompt(prompt);
        }
      }
    });

    // Search input removed

    // Enhanced result button handlers
    if (insertBtn) {
      insertBtn.addEventListener('click', (e) => {
        if (state.debug) console.log('🖱️ Insert button clicked', latestResponse);
        e.preventDefault();
        e.stopPropagation();
        insertBtn.style.pointerEvents = 'auto';
        insertHandler(latestResponse);
      });
    } else {
      console.warn('❌ Insert button not found');
    }
    
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        if (state.debug) console.log('🖱️ Copy button clicked', latestResponse);
        e.preventDefault();
        e.stopPropagation();
        copyBtn.style.pointerEvents = 'auto';
        copyHandler(latestResponse);
      });
    } else {
      console.warn('❌ Copy button not found');
    }
    
    themeToggle.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      state.isDarkTheme = !state.isDarkTheme;
      
      if (state.isDarkTheme) {
        panel.classList.add('dark-theme');
        themeToggle.classList.add('dark');
        themeToggleIcon.innerHTML = '🌙';
      } else {
        panel.classList.remove('dark-theme');
        themeToggle.classList.remove('dark');
        themeToggleIcon.innerHTML = '☀️';
      }
      
      await utils.saveSettings({ 
        theme: state.isDarkTheme ? 'dark' : 'light',
        model: currentModel 
      });
    });
    
    // Enhanced click-outside detection
    const handleClickOutside = (event) => {
      if (!isOpen) return;
      
      const path = event.composedPath();
      const isInsidePanel = path.includes(panel) || 
                          path.includes(host) ||
                          event.target === host ||
                          event.target.closest('#wandpen-panel-host');
      
      if (!isInsidePanel && !event.target.closest('#wandpen-badge-host')) {
        state.lastCloseTime = Date.now();
        state.suppressSelectionUpdates = true;
        state.badge.hide();
        cancelHandler();
        
        setTimeout(() => {
          state.suppressSelectionUpdates = false;
        }, CONSTANTS.SUPPRESS_LONG_DELAY);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside, true);
    
    // Escape key handler
    const escapeHandler = (event) => {
      if (event.key === 'Escape' && isOpen) {
        state.lastCloseTime = Date.now();
        state.suppressSelectionUpdates = true;
        state.badge.hide();
        cancelHandler();
        
        setTimeout(() => {
          state.suppressSelectionUpdates = false;
        }, CONSTANTS.SUPPRESS_LONG_DELAY);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    return {
      open(rect, _selectionText, presetInstruction = '') {
        if (state.debug) {
          console.log('🔍 Panel opening with:', {
            selectionText: _selectionText,
            stateSelectionText: state.selectionText,
            rect: rect
          });
        }
        
        // Use the passed selectionText to prevent corruption
        if (_selectionText) {
          state.selectionText = _selectionText;
          if (state.debug) {
            console.log('✅ Updated state.selectionText with captured text:', _selectionText.substring(0, 50) + '...');
          }
        }
        
        state.suppressSelectionUpdates = true;
        isOpen = true;
        
        // Reset UI
        statusEl.innerHTML = '';
        statusEl.classList.remove('error');
        customPrompt.classList.remove('visible');
        customInput.value = '';
        clearResult();
        
        // Ensure all buttons are responsive
        ensureButtonsResponsive();
        
        // Debug: Test button state
        if (state.debug) {
          setTimeout(testButtonClicks, 100);
        }
        
        // Position panel
        const position = calculateSmartPosition(rect, CONSTANTS.PANEL_WIDTH, CONSTANTS.PANEL_HEIGHT);
        panel.style.top = `${position.top}px`;
        panel.style.left = `${position.left}px`;
        
        // Initial state for smooth fade-in
        panel.style.opacity = '0';
        panel.style.transform = 'scale(0.92) translateY(-8px)';
        panel.classList.add('visible');
        
        // Focus management
        requestAnimationFrame(() => {
          panel.classList.add('show');
          panel.style.opacity = '1';
          panel.style.transform = 'scale(1) translateY(0)';
          
          // Focus management - search input removed
        });
        
        // Handle preset
        if (presetInstruction) {
          if (presetInstruction.includes('grammar')) {
            setTimeout(() => handleQuickAction('grammar'), 100);
          } else if (presetInstruction.includes('improve')) {
            setTimeout(() => handleQuickAction('improve'), 100);
          } else {
            customPrompt.classList.add('visible');
            customInput.value = presetInstruction;
            setTimeout(() => customInput.focus(), 200);
          }
        }
        
        setTimeout(() => {
          state.suppressSelectionUpdates = false;
        }, 200);
      },
      
      close() {
        isOpen = false;
        
        // Smooth fade-out animation
        panel.classList.add('hide');
        panel.classList.remove('show');
        panel.style.opacity = '0';
        panel.style.transform = 'scale(0.92) translateY(-8px)';
        
        setTimeout(() => {
          panel.classList.remove('visible', 'hide');
          customPrompt.classList.remove('visible');
          clearResult();
          statusEl.innerHTML = '';
          panel.style.opacity = '';
          panel.style.transform = '';
        }, 250);
      },
      
      isOpen() {
        return isOpen;
      },
      
      setLoading(isLoading, message) {
        setLoading(isLoading, message);
      },
      
      showResult(text) {
        showResult(text);
      },
      
      showError(message) {
        showError(message);
      },
      
      showStatus(message) {
        statusEl.textContent = message;
        statusEl.classList.remove('error');
      },
      
      onSubmit(handler) {
        submitHandler = handler;
      },
      
      onInsert(handler) {
        insertHandler = handler;
      },
      
      onCopy(handler) {
        copyHandler = handler;
      },
      
      onCancel(handler) {
        cancelHandler = handler;
      },
      
      getElement() {
        return panel;
      },
      
      setModel(model) {
        currentModel = model;
        const modelText = modelButton.querySelector('span');
        if (modelText) {
          modelText.textContent = model;
        }
      },
      
      setTheme(isDark) {
        if (isDark) {
          panel.classList.add('dark-theme');
          themeToggle.classList.add('dark');
          themeToggleIcon.innerHTML = '🌙';
        } else {
          panel.classList.remove('dark-theme');
          themeToggle.classList.remove('dark');
          themeToggleIcon.innerHTML = '☀️';
        }
      },
      
      updatePosition(rect) {
        if (isOpen && rect) {
          const position = calculateSmartPosition(rect, CONSTANTS.PANEL_WIDTH, CONSTANTS.PANEL_HEIGHT);
          panel.style.top = `${position.top}px`;
          panel.style.left = `${position.left}px`;
        }
      },
      
      triggerAction(action) {
        const targetMenuItem = panel.querySelector(`[data-action="${action}"]`);
        if (targetMenuItem) {
          menuItems.forEach(item => item.classList.remove('active'));
          targetMenuItem.classList.add('active');
          
          if (action === 'improve') {
            handleQuickAction('improve');
          } else if (action === 'grammar') {
            handleQuickAction('grammar');
          } else if (action === 'summarise') {
            handleQuickAction('summarise');
          }
        }
      }
    };
  }

  async function createChatOverlay() {
    const container = document.createElement('div');
    container.id = 'wandpen-chat-host';
    document.documentElement.appendChild(container);

    const shadow = container.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 2147483645;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
      }
      .overlay.visible {
        display: flex;
      }
      .panel {
        width: min(600px, 90vw);
        max-height: 80vh;
        background: #f8fafc;
        border-radius: 18px;
        box-shadow: 0 30px 60px rgba(15, 23, 42, 0.35);
        display: flex;
        flex-direction: column;
        overflow: visible;
        animation: chatPanelAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }
      @keyframes chatPanelAppear {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(15, 23, 42, 0.1);
      }
      header h2 {
        margin: 0;
        font-size: 18px;
      }
      header button {
        border: none;
        background: transparent;
        font-size: 22px;
        cursor: pointer;
        color: #475569;
      }
      .history {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #e2e8f0;
      }
      .message {
        padding: 12px 14px;
        border-radius: 12px;
        line-height: 1.55;
        white-space: pre-wrap;
        max-width: 80%;
        animation: messageAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes messageAppear {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .message.user {
        align-self: flex-end;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff;
      }
      .message.assistant {
        align-self: flex-start;
        background: #fff;
        color: #0f172a;
        border: 1px solid rgba(102, 126, 234, 0.2);
      }
      form {
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        border-top: 1px solid rgba(15, 23, 42, 0.1);
      }
      textarea {
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.5);
        padding: 12px 14px;
        resize: vertical;
        min-height: 90px;
        font-size: 14px;
        font-family: inherit;
      }
      textarea:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .actions button {
        border: none;
        border-radius: 12px;
        padding: 10px 18px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .actions .send {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff;
      }
      .actions .send:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      .actions .send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
    `;
    shadow.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'WandPen Chat');
    overlay.innerHTML = `
      <div class="panel">
        <header>
          <h2>WandPen Chat</h2>
          <button type="button" class="close" aria-label="Close chat">×</button>
        </header>
        <div class="history" role="log" aria-live="polite"></div>
        <form>
          <textarea placeholder="Ask WandPen anything…" aria-label="Chat message input"></textarea>
          <div class="actions">
            <button type="submit" class="send" aria-label="Send message">Send</button>
          </div>
        </form>
      </div>
    `;
    shadow.appendChild(overlay);

    const historyEl = overlay.querySelector('.history');
    const textarea = overlay.querySelector('textarea');
    const closeBtn = overlay.querySelector('.close');
    const form = overlay.querySelector('form');
    const sendBtn = overlay.querySelector('.send');

    closeBtn.addEventListener('click', () => api.toggle(false));
    overlay.addEventListener('mousedown', (event) => {
      if (event.target === overlay) api.toggle(false);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = textarea.value.trim();
      if (!value) return;
      textarea.value = '';
      onSend(value);
    });

    let onSend = () => {};

    const api = {
      toggle(force) {
        const next = typeof force === 'boolean' ? force : !overlay.classList.contains('visible');
        overlay.classList.toggle('visible', next);
        if (next) {
          textarea.focus();
        }
      },
      setLoading(isLoading) {
        sendBtn.disabled = Boolean(isLoading);
      },
      pushMessage(message) {
        const div = document.createElement('div');
        div.className = `message ${message.role}`;
        div.textContent = message.content;
        historyEl.appendChild(div);
        historyEl.scrollTop = historyEl.scrollHeight;
      },
      getHistory() {
        const messages = [];
        historyEl.querySelectorAll('.message').forEach((node) => {
          const role = node.classList.contains('user') ? 'user' : 'assistant';
          messages.push({ role, content: node.textContent || '' });
        });
        return messages;
      },
      onSend(handler) {
        onSend = handler;
      },
      onToggle() {}
    };

    return api;
  }
  
  if (state.debug) {
    console.log('🎉 WandPen content script fully loaded and ready!');
  }
})();