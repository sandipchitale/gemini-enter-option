let swapEnter = true;
let switchUI = null;

// --- Site Configuration ---
const SITES = {
    GEMINI: {
        host: 'gemini.google.com',
        inject: injectGemini
    },
    CHATGPT: {
        host: 'chatgpt.com',
        inject: injectChatGPT
    },
    CLAUDE: {
        host: 'claude.ai',
        inject: injectClaude
    },
    CHATGATE: {
        host: 'chatgate.ai',
        inject: injectChatGate
    }
};

const currentSite = Object.values(SITES).find(site => location.hostname.endsWith(site.host));

// --- Storage Management ---
chrome.storage.sync.get({ swapEnter: true }, (items) => {
    swapEnter = items.swapEnter;
    updateSwitchState();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.swapEnter) {
        swapEnter = changes.swapEnter.newValue;
        updateSwitchState();
    }
});

function updateSwitchState() {
    if (switchUI) {
        const input = switchUI.querySelector('input');
        if (input) input.checked = swapEnter;

        const label = switchUI.querySelector('label');
        if (label) {
            label.title = swapEnter 
                ? "Enter key will add a new line (Ctrl+Enter to toggle)" 
                : "Enter key will submit the prompt (Ctrl+Enter to toggle)";
        }
    }
}

// --- UI Creation ---
function createSwitchUI() {
    const container = document.createElement('div');
    container.id = 'gemini-enter-fix-switch';
    container.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 8px;
        font-family: 'Google Sans', Roboto, sans-serif;
        font-size: 13px;
        color: var(--gem-sys-color-on-surface, inherit);
        user-select: none;
        opacity: 0.7;
        transition: opacity 0.2s;
        margin-right: 8px;
    `;
    
    // Adjust color for ChatGPT (which is often dark or has specific text colors)
    // Adjust color for ChatGPT (which is often dark or has specific text colors)
    if (currentSite === SITES.CHATGPT) {
        container.style.color = 'inherit'; // Use inherited color from parent
        container.style.height = 'auto'; // Allow auto height to fit in footer
        container.style.minHeight = '32px'; // Minimum touch target
        container.style.alignSelf = 'center'; // Center vertically in flex container
        container.style.marginTop = '4px'; // Add slight top margin if it wraps
        container.style.marginBottom = '4px';
        container.style.whiteSpace = 'nowrap'; // Prevent internal wrapping
        container.style.flexShrink = '0'; // Prevent shrinking
    } else {
        container.style.height = '100%';
    }
    
    container.onmouseover = () => container.style.opacity = '1';
    container.onmouseout = () => container.style.opacity = '0.7';

    // Label
    const labelText = document.createElement('span');
    labelText.textContent = 'Enter: ';
    labelText.style.marginRight = '2px';
    container.appendChild(labelText);

    // Send Icon
    const sendIcon = document.createElement('span');
    const sendSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sendSvg.setAttribute("width", "16");
    sendSvg.setAttribute("height", "16");
    sendSvg.setAttribute("viewBox", "0 0 24 24");
    sendSvg.setAttribute("fill", "currentColor");
    const sendPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    sendPath.setAttribute("d", "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z");
    sendSvg.appendChild(sendPath);
    sendIcon.appendChild(sendSvg);
    sendIcon.style.display = 'flex';
    sendIcon.title = 'Enter will submit the prompt option';
    container.appendChild(sendIcon);

    // Switch Control
    const label = document.createElement('label');
    label.style.cssText = `
        position: relative;
        display: inline-block;
        width: 32px;
        height: 18px;
        margin: 0 4px;
        cursor: pointer;
    `;
    label.title = swapEnter 
        ? "Enter key will add a new line (Ctrl+Enter to toggle)" 
        : "Enter key will submit the prompt (Ctrl+Enter to toggle)";

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = swapEnter;
    input.style.cssText = `opacity: 0; width: 0; height: 0; margin: 0;`;
    
    const slider = document.createElement('span');
    slider.className = 'slider';
    slider.style.cssText = `
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 34px;
    `;

    const knob = document.createElement('span');
    knob.className = 'knob';
    knob.style.cssText = `
        position: absolute;
        content: "";
        height: 14px;
        width: 14px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    `;
    
    slider.appendChild(knob);
    label.appendChild(input);
    label.appendChild(slider);
    container.appendChild(label);

    // Newline Icon
    const newlineIcon = document.createElement('span');
    const newlineSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    newlineSvg.setAttribute("width", "16");
    newlineSvg.setAttribute("height", "16");
    newlineSvg.setAttribute("viewBox", "0 0 24 24");
    newlineSvg.setAttribute("fill", "currentColor");
    const newlinePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newlinePath.setAttribute("d", "M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7h-2z");
    newlineSvg.appendChild(newlinePath);
    newlineIcon.appendChild(newlineSvg);
    newlineIcon.style.display = 'flex';
    newlineIcon.title = 'Enter adds new line option';
    container.appendChild(newlineIcon);

    input.addEventListener('change', (e) => {
        chrome.storage.sync.set({ swapEnter: e.target.checked });
    });

    // Inject styles once
    if (!document.getElementById('gemini-enter-fix-styles')) {
        const style = document.createElement('style');
        style.id = 'gemini-enter-fix-styles';
        style.textContent = `
            #gemini-enter-fix-switch input:checked + .slider { background-color: #4caf50; }
            #gemini-enter-fix-switch input:focus + .slider { box-shadow: 0 0 1px #4caf50; }
            #gemini-enter-fix-switch input:checked + .slider .knob { transform: translateX(14px); }
            @media (prefers-color-scheme: dark) {
                 #gemini-enter-fix-switch .slider { background-color: #555; }
            }
        `;
        document.head.appendChild(style);
    }

    switchUI = container;
    return container;
}

// --- Injection Logic ---

function injectGemini(ui) {
    // Strategy: Ensure custom UI is the FIRST child of `.trailing-actions-wrapper`
    
    // 1. Locate the container
    let container = document.querySelector('.trailing-actions-wrapper');
    
    // 2. Fallback
    if (!container) {
        const switchBtn = document.querySelector('button.input-area-switch');
        if (switchBtn) {
            container = switchBtn.closest('.trailing-actions-wrapper');
        }
    }
    
    // 3. Deep search
    if (!container) {
        const micWrapper = document.querySelector('.input-buttons-wrapper-bottom');
        if (micWrapper && micWrapper.parentNode && micWrapper.parentNode.children.length > 0) {
            container = micWrapper.parentNode;
        }
    }

    if (container && container.firstElementChild !== ui) {
        container.insertBefore(ui, container.firstElementChild);
    }
}

function injectChatGPT(ui) {
    const textarea = document.getElementById('prompt-textarea');
    if (!textarea) return;

    // Walk up from textarea to find the local container enclosing the input and its buttons/actions.
    // This scopes all queries safely to the input area and avoids matching chat history.
    let container = null;
    let current = textarea;
    for (let i = 0; i < 5; i++) {
        if (!current.parentElement) break;
        const parent = current.parentElement;
        const lastChild = parent.lastElementChild;
        if (lastChild && !lastChild.contains(textarea) && lastChild !== textarea) {
            if (lastChild.tagName === 'BUTTON' || lastChild.querySelector('button') || lastChild.querySelector('svg')) {
                container = parent;
                break;
            }
        }
        current = parent;
    }

    if (!container) {
        container = textarea.parentElement;
    }
    if (!container) return;

    // Try multiple selectors for the footer area specifically inside the scoped container
    const separators = [
        '[class~="[grid-area:footer]"]',
        '[data-testid="composer-footer"]',
        '.flex.items-end.gap-2'
    ];

    let footer = null;
    for (const selector of separators) {
        try {
            footer = container.querySelector(selector);
            if (footer) break;
        } catch (e) {
            // Ignore selector errors
        }
    }

    if (footer) {
        // Footer exists (Attach mode)
        // Try to place it next to the Voice/Send button (usually on the right) for consistency
        const voiceBtn = Array.from(footer.children).find(child => 
            child.textContent.includes('Voice') || 
            child.querySelector('svg') && !child.textContent.includes('Attach') // Heuristic: icon button that isn't attach
        );
        
        if (!footer.contains(ui)) {
            ui.style.height = 'auto'; // Reset heights
            ui.style.margin = '0 8px'; // Add generic spacing
            
            if (voiceBtn) {
                 // Insert before the voice button (placing it to its left)
                 footer.insertBefore(ui, voiceBtn);
                 ui.style.alignSelf = 'center';
            } else {
                 // If can't find voice button, just append to end (Right side usually)
                 footer.appendChild(ui);
                 ui.style.marginLeft = 'auto'; // Pushes it to the right if flex
            }
        }
    } else {
        // Fallback for "Search/New Chat" mode or standard Pill layout
        // First try to locate the grid trailing area if it exists within the container
        const trailing = container.querySelector('[class~="[grid-area:trailing]"]') || 
                         container.querySelector('[grid-area="trailing"]');
        
        if (trailing) {
            // Locate the button group inside trailing area, typically a div with flex items
            const buttonGroup = trailing.querySelector('.flex') || trailing;
            
            if (!buttonGroup.contains(ui)) {
                ui.style.height = 'auto'; 
                ui.style.minHeight = 'auto';
                ui.style.margin = '0 6px';
                ui.style.padding = '0';
                ui.style.backgroundColor = 'transparent';
                ui.style.alignSelf = 'center';
                ui.style.display = 'flex';
                ui.style.flexShrink = '0';
                ui.style.color = 'inherit';

                if (buttonGroup.firstElementChild) {
                    buttonGroup.insertBefore(ui, buttonGroup.firstElementChild);
                } else {
                    buttonGroup.appendChild(ui);
                }
            }
        } else {
            // No trailing area found, inject relative to the buttons at the end of the container
            let target = container.lastElementChild;
            let insertMode = 'insertBefore'; // or 'prepend' if targeting a group
            
            if (target.tagName !== 'BUTTON' && target.children.length > 0) {
                // It's likely a wrapper group.
                insertMode = 'prepend';
            } else {
                // It's likely a loose list of buttons
                let candidate = target;
                while (candidate.previousElementSibling) {
                    const prev = candidate.previousElementSibling;
                    if (prev.contains(textarea) || prev === textarea) {
                        break; // Stop, we hit the input
                    }
                    if (prev.tagName === 'BUTTON' || prev.querySelector('button') || prev.querySelector('svg')) {
                         candidate = prev; // Move target left to this button
                    } else {
                        break; // Unknown separator
                    }
                }
                target = candidate;
                insertMode = 'insertBefore';
            }

            const parentOfTarget = (insertMode === 'prepend') ? target : container;
            
            if (!parentOfTarget.contains(ui)) {
                 // Styling
                 ui.style.height = 'auto'; 
                 ui.style.minHeight = 'auto';
                 ui.style.margin = '0 6px'; // Balanced spacing
                 ui.style.padding = '0';
                 ui.style.backgroundColor = 'transparent';
                 ui.style.alignSelf = 'center';
                 ui.style.display = 'flex';
                 ui.style.flexShrink = '0';
                 ui.style.color = 'inherit';

                 if (insertMode === 'prepend') {
                      if (target.firstElementChild) {
                          target.insertBefore(ui, target.firstElementChild);
                      } else {
                          target.appendChild(ui);
                      }
                 } else {
                      container.insertBefore(ui, target);
                 }
            }
        }
    }
}

function injectChatGate(ui) {
    // Based on provided DOM:
    // .input-toolbar -> .toolbar-right -> #send-btn
    
    const toolbarRight = document.querySelector('.toolbar-right');
    if (toolbarRight) {
        const sendBtn = document.getElementById('send-btn') || toolbarRight.querySelector('.send-btn');
        
        if (sendBtn && !toolbarRight.contains(ui)) {
            // Styling for ChatGate toolbar
            ui.style.height = 'auto';
            ui.style.minHeight = 'auto';
            ui.style.margin = '0 8px 0 0'; // Right margin to separate from Send
            ui.style.padding = '0';
            ui.style.backgroundColor = 'transparent';
            ui.style.alignSelf = 'center';
            ui.style.display = 'flex';
            ui.style.flexShrink = '0';
            ui.style.color = 'inherit';

            // Insert before the send button
            toolbarRight.insertBefore(ui, sendBtn);
        }
    }
}

function injectClaude(ui) {
    // Anchor on the model selector — always present in the bottom toolbar row,
    // unlike the send button (only appears when text is entered) which causes
    // findClaudeToolbar to stop at a small inner flex container instead of the
    // real toolbar, scrambling the UI.
    const modelSelector = document.querySelector('button[data-testid="model-selector-dropdown"]');
    if (!modelSelector) return;

    // Walk up from the model selector to find the flex toolbar row.
    let toolbar = modelSelector.parentElement;
    while (toolbar && toolbar !== document.body) {
        const style = window.getComputedStyle(toolbar);
        if ((style.display === 'flex' || style.display === 'inline-flex') && toolbar.children.length >= 2) {
            break;
        }
        toolbar = toolbar.parentElement;
    }
    if (!toolbar || toolbar === document.body || toolbar.contains(ui)) return;

    // Find the model selector's direct-child-of-toolbar ancestor.
    let modelSelectorContainer = modelSelector;
    while (modelSelectorContainer.parentElement !== toolbar) {
        modelSelectorContainer = modelSelectorContainer.parentElement;
        if (!modelSelectorContainer || modelSelectorContainer === document.body) return;
    }

    // Insert between the model selector container and the voice/send area (its next sibling).
    ui.style.height = 'auto';
    ui.style.minHeight = 'auto';
    ui.style.margin = '0 8px';
    ui.style.padding = '0';
    ui.style.backgroundColor = 'transparent';
    ui.style.alignSelf = 'center';
    ui.style.display = 'flex';
    ui.style.flexShrink = '0';
    ui.style.color = 'inherit';
    ui.style.opacity = '0.7';

    const insertionPoint = modelSelectorContainer.nextElementSibling;
    if (insertionPoint) {
        toolbar.insertBefore(ui, insertionPoint);
    } else {
        toolbar.appendChild(ui);
    }
}

function inject() {
    if (!currentSite) return;

    let ui = document.getElementById('gemini-enter-fix-switch');
    if (!ui) {
        ui = createSwitchUI();
    }
    
    currentSite.inject(ui);
}

// --- Observers & Lifecycle ---

// 1. MutationObserver for reactive updates (Debounced)
let injectTimeout;
const observer = new MutationObserver((mutations) => {
    if (injectTimeout) return;
    injectTimeout = requestAnimationFrame(() => {
        inject();
        injectTimeout = null;
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// 2. Initialization checks
inject();
// Periodic check (Relaxed interval as fallback)
setInterval(inject, 5000);

// --- Key Event Interception ---

const handleKey = (e) => {
  if (e.key !== 'Enter') return; // FAST PATH: Ignore all non-Enter keys immediately

  // Toggle shortcut: Ctrl+Enter for all platforms
  if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      // Prevent default action and propagation
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Only act on keydown to avoid double-toggling
      if (e.type === 'keydown') {
          const newState = !swapEnter;
          swapEnter = newState;
          updateSwitchState();
          chrome.storage.sync.set({ swapEnter: newState });
      }
      return;
  }
  
  if (!swapEnter) return;
  if (!e.isTrusted) return; // Ignore synthetic events we dispatch

  const target = e.target;
  const isInput = target.isContentEditable || target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target.type === 'text');
  if (!isInput) return;

  // Additional check for ChatGPT
  if (currentSite === SITES.CHATGPT && target.id !== 'prompt-textarea') return;

  // Check for ChatGate / Claude
  if (currentSite === SITES.CHATGATE || currentSite === SITES.CLAUDE) {
      const isMessageInput = target.id === 'message-input' || target.classList.contains('message-input');
      const isClaudeInput = target.getAttribute('data-testid') === 'chat-input';
      const isContentEditable = target.isContentEditable;

      if (!isMessageInput && !isClaudeInput && !isContentEditable) return;
  }

  // Determine desired action based on Swap state
  // If Swap is ON: 
  //   Enter (no shift) -> Newline (Shift+Enter behavior)
  //   Shift+Enter      -> Submit (Enter behavior)
  
  const isShift = e.shiftKey;
  
  if (isShift) {
      // User pressed Shift+Enter. We want Submit (Enter).
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (e.type === 'keydown') {
          // For Claude: clicking the send button is more reliable than synthetic keyboard events
          if (currentSite === SITES.CLAUDE) {
              const sendBtn = document.querySelector('button[aria-label="Send message"]');
              if (sendBtn && !sendBtn.disabled) sendBtn.click();
              return;
          }

          const newEvent = new KeyboardEvent('keydown', {
              key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
              bubbles: true, cancelable: true, composed: true,
              shiftKey: false, // REMOVE SHIFT for Submit
              ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey
          });
          target.dispatchEvent(newEvent);
      }
  } else {
      // User pressed Enter. We want Newline (Shift+Enter).
      // Swallow this event and dispatch Shift+Enter.
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      if (e.type === 'keydown') {
          // Special handling for ContentEditable (Claude/ProseMirror)

          if (currentSite === SITES.CLAUDE || currentSite === SITES.CHATGATE) {
              // Use the W3C InputEvent API — React and ProseMirror-based editors handle this.
              // This is more reliable than synthetic keyboard events for rich text editors.
              const lineBreakEvent = new InputEvent('beforeinput', {
                  inputType: 'insertLineBreak',
                  bubbles: true,
                  cancelable: true
              });
              target.dispatchEvent(lineBreakEvent);

              // Fallback: synthetic Shift+Enter for editors that rely on keyboard events
              const shiftEnterDown = new KeyboardEvent('keydown', {
                  key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                  bubbles: true, cancelable: true, composed: true,
                  shiftKey: true,
                  ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey,
                  view: window
              });
              target.dispatchEvent(shiftEnterDown);

              return;
          }

          const newEvent = new KeyboardEvent('keydown', {
              key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
              bubbles: true, cancelable: true, composed: true,
              shiftKey: true, // ADD SHIFT for Newline
              ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey
          });
          target.dispatchEvent(newEvent);
      }
  }
};

// Use capture phase on window to catch it first
window.addEventListener('keydown', handleKey, true);
window.addEventListener('keypress', handleKey, true);
window.addEventListener('keyup', handleKey, true);
