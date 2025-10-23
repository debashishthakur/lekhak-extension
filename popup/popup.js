const menuItems = document.querySelectorAll('.menu-item');
const openOptionsButton = document.getElementById('open-options');
const searchInput = document.getElementById('search-input');
const aiSwitch = document.getElementById('ai-switch');
const status = document.createElement('p');
status.className = 'status';
document.querySelector('.popup-wrapper').appendChild(status);

// Handle menu item clicks
menuItems.forEach(item => {
  item.addEventListener('click', async () => {
    const action = item.dataset.action;
    
    // Update active state
    menuItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showStatus('No active tab found.', true);
      return;
    }
    if (!tab.url || !/^https?:/i.test(tab.url)) {
      showStatus('Lekhak works on standard web pages only.', true);
      return;
    }
    
    try {
      await chrome.tabs.sendMessage(tab.id, { 
        type: 'lekhak:toggle-chat', 
        source: 'popup',
        action: action,
        customPrompt: action === 'custom' ? searchInput.value : null
      });
      window.close();
    } catch (error) {
      showStatus('Reload the page to activate Lekhak.', true);
    }
  });
});

// Handle search input for custom prompts
searchInput.addEventListener('input', () => {
  const customMenuItem = document.querySelector('[data-action="custom"]');
  if (searchInput.value.trim()) {
    customMenuItem.classList.add('active');
    menuItems.forEach(item => {
      if (item !== customMenuItem) {
        item.classList.remove('active');
      }
    });
  }
});

// Handle Enter key in search input
searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && searchInput.value.trim()) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showStatus('No active tab found.', true);
      return;
    }
    if (!tab.url || !/^https?:/i.test(tab.url)) {
      showStatus('Lekhak works on standard web pages only.', true);
      return;
    }
    
    try {
      await chrome.tabs.sendMessage(tab.id, { 
        type: 'lekhak:toggle-chat', 
        source: 'popup',
        action: 'custom',
        customPrompt: searchInput.value
      });
      window.close();
    } catch (error) {
      showStatus('Reload the page to activate Lekhak.', true);
    }
  }
});

// Handle AI switch toggle
aiSwitch.addEventListener('change', () => {
  // This could be used to toggle between different AI models or modes
  console.log('AI switch toggled:', aiSwitch.checked);
});

// Handle options/settings button
openOptionsButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}
