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
                ? "Enter key will add a new line" 
                : "Enter key will submit the prompt";
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
        ? "Enter key will add a new line" 
        : "Enter key will submit the prompt";

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
    // Strategy: Append to the footer area [grid-area:footer]
    // The footer usually contains attachment/search buttons.
    
    // Try multiple selectors for the footer
    const separators = [
        '.\\\\[grid-area\\\\:footer\\\\]', // Escaped for JS string to produce CSS selector .\[grid-area\:footer\]
        '[data-testid="composer-footer"]',
        '.flex.items-end.gap-2'
    ];

    let footer = null;
    try {
        footer = document.querySelector('.\\\\[grid-area\\\\:footer\\\\]');
    } catch (e) {
        // Ignore selector errors
    }

    if (!footer) {
        // Fallback: finding sibling of the textarea
        const textarea = document.getElementById('prompt-textarea');
        if (textarea) {
            // The footer is usually a sibling in the grid
            const grid = textarea.closest('.grid');
            if (grid) {
                // Try to find the element that matches footer characteristics
                for (let child of grid.children) {
                    const style = window.getComputedStyle(child);
                    if (style.gridArea === 'footer') {
                        footer = child;
                        break;
                    }
                }
            }
        }
    }

    if (footer) {
        // Footer exists (Attach mode)
        // Try to place it next to the Voice button (usually on the right) for consistency
        
        // Look for the voice button
        // It usually has "Voice" text or specific aria labels
        const voiceBtn = Array.from(footer.children).find(child => 
            child.textContent.includes('Voice') || 
            child.querySelector('svg') && !child.textContent.includes('Attach') // Heuristic: icon button that isn't attach
        );
        
        if (!footer.contains(ui)) {
            // Check if footer is flex
            const style = window.getComputedStyle(footer);
            ui.style.height = 'auto'; // Reset heights
            ui.style.margin = '0 8px'; // Add generic spacing
            
            if (voiceBtn) {
                 // Insert before the voice button (placing it to its left)
                 footer.insertBefore(ui, voiceBtn);
                 // If flex, align center
                 ui.style.alignSelf = 'center';
            } else {
                // If can't find voice button, just append to end (Right side usually)
                // If flex row, this puts it on the far right.
                footer.appendChild(ui);
                ui.style.marginLeft = 'auto'; // Pushes it to the right if flex
            }
        }
    } else {
        // Fallback for "Search/New Chat" mode (Pill layout)
        const textarea = document.getElementById('prompt-textarea');
        if (textarea) {
            // Strategy: 
            // 1. Traverse parents to find the "Pill" container.
            //    The Pill container is characterized by having the input area AND some buttons on the right (Mic, Send).
            //    So, the Pill's `lastElementChild` should definitively be a button or a group of buttons.
            
            let pillContainer = null;
            let current = textarea;
            
            for (let i = 0; i < 5; i++) {
                if (!current.parentElement) break;
                const parent = current.parentElement;
                
                const lastChild = parent.lastElementChild;
                
                // If the last child is the textarea (or its wrapper), then this parent likely 
                // doesn't contain the right-side buttons we are looking for. Keep going up.
                if (lastChild && !lastChild.contains(textarea) && lastChild !== textarea) {
                     // Check if this last child looks like it contains generic buttons/actions
                     // (Heuristic: it's a button or has buttons inside)
                     if (lastChild.tagName === 'BUTTON' || lastChild.querySelector('button') || lastChild.querySelector('svg')) {
                         pillContainer = parent;
                         break;
                     }
                }
                current = parent;
            }

            if (pillContainer) {
                // We have the container. Now determine exact insertion point.
                // We want to be to the LEFT of the Right-Side controls (Mic, Send).
                // The Right-Side controls typically end at `pillContainer.lastElementChild`.
                
                let target = pillContainer.lastElementChild;
                let insertMode = 'insertBefore'; // or 'prepend' if targeting a group
                
                // Check if the last element is a wrapper group (e.g. div holding Mic+Send)
                // or just the last button (e.g. Send).
                
                if (target.tagName !== 'BUTTON' && target.children.length > 0) {
                    // It's likely a wrapper group.
                    // We want to be inside this group, at the start (Left of Mic).
                    insertMode = 'prepend';
                } else {
                    // It's likely a loose list of buttons (e.g. ... [Mic] [Send]).
                    // Walk backwards from the last child to find the start of this button run.
                    // We stop when we hit the textarea (or its wrapper) or something that isn't a button.
                    
                    let candidate = target;
                    while (candidate.previousElementSibling) {
                        const prev = candidate.previousElementSibling;
                        if (prev.contains(textarea) || prev === textarea) {
                            break; // Stop, we hit the input
                        }
                        if (prev.tagName === 'BUTTON' || prev.querySelector('button') || prev.querySelector('svg')) {
                             candidate = prev; // Move target left to this button (e.g. Send -> Mic)
                        } else {
                            break; // Unknown separator
                        }
                    }
                    target = candidate; // This should be the Mic button
                    insertMode = 'insertBefore';
                }

                const parentOfTarget = (insertMode === 'prepend') ? target : pillContainer;
                
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
                         pillContainer.insertBefore(ui, target);
                     }
                }
            } else {
                 // Last ditch fallback
                 const directParent = textarea.parentElement;
                 if (directParent && !directParent.contains(ui)) {
                     directParent.style.display = 'flex'; 
                     directParent.style.flexWrap = 'wrap'; 
                     directParent.appendChild(ui);
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
    // Strategy for Claude:
    // Support two states:
    // 1. "Pill" mode (input + buttons in one row)
    // 2. Multiline mode (check if buttons are separate)
    
    // Main text area for context
    const inputArea = document.querySelector('[contenteditable="true"]');
    
    if (inputArea) {
        // Find the "Send message" button
        // Claude uses an aria-label="Send message"
        const sendBtn = document.querySelector('button[aria-label="Send message"]');
        
        if (sendBtn) {
            // The Send button is usually wrapped in a div, which might be wrapped in another div.
            // We want to be in the same flex container as the send button (or its wrapper).
            
            // In the provided DOM: 
            // <div class="flex gap-2 w-full items-center">
            //    <div class="relative flex-1 ...">...</div>  (Input/Left controls)
            //    <div class="overflow-hidden list-none p-1 ..."> (Model Selector)
            //    <div style="opacity: 1; transform: none;"> (Send Button Wrapper)
            
            // So we want to engage with the container holding these items.
            
            // Traverse up from Send Button to find the best insertion point.
            // Usually we want to be to the LEFT of the Send button (or the Model Selector if present).
            
            let targetGroup = sendBtn.parentElement;
            
            // Go up until we hit the main toolbar container (flex row)
            // Heuristic: check if parent has class "flex" and "items-center" or similar layout
            
            // Let's look for the main container that holds the input input area's sibling
            // Actually, in the provided DOM, the input area is in a separate upper div, 
            // and the toolbar is below it? 
            // "flex flex-col m-3.5 gap-3" -> "relative" (input) -> "flex gap-2 w-full items-center" (toolbar)
            
            // So we want to find that "flex gap-2 w-full items-center" container.
            
            const toolbar = inputArea.closest('.flex.flex-col').querySelector('.flex.gap-2.w-full.items-center');
            
            if (toolbar) {
                 // The toolbar children are:
                 // 1. Left side (Attachment icon, etc.)
                 // 2. Model Selector (maybe)
                 // 3. Send Button (maybe wrapped)
                 
                 // We want to insert validly into this flex container.
                 // Ideally before the Model Selector or the Send Button group.
                 
                 // Find the child that contains the send button
                 let sendContainer = Array.from(toolbar.children).find(c => c.contains(sendBtn));
                 
                 // Find model selector if exists
                 const modelSelector = Array.from(toolbar.children).find(c => 
                    c.querySelector('[data-testid="model-selector-dropdown"]')
                 );
                 
                 let insertionPoint = modelSelector || sendContainer;
                 
                 if (insertionPoint && !toolbar.contains(ui)) {
                     // Styles
                     ui.style.height = 'auto'; 
                     ui.style.minHeight = 'auto';
                     ui.style.margin = '0 8px 0 auto'; // Auto left to push right, or regular margin
                     ui.style.padding = '0';
                     ui.style.backgroundColor = 'transparent';
                     ui.style.alignSelf = 'center';
                     ui.style.display = 'flex';
                     ui.style.flexShrink = '0';
                     ui.style.color = 'inherit';
                     ui.style.opacity = '0.7'; // Match Claude's muted aesthetic
                     
                     toolbar.insertBefore(ui, insertionPoint);
                 }
            } else {
                // Fallback: direct parent of send button wrapper?
                if (targetGroup && !targetGroup.contains(ui)) {
                     ui.style.marginRight = '8px';
                     targetGroup.parentElement.insertBefore(ui, targetGroup);
                }
            }
        }
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

// 1. MutationObserver for reactive updates
const observer = new MutationObserver((mutations) => {
    inject();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// 2. Initialization checks
inject();
// Periodic check
setInterval(inject, 2000);

// --- Key Event Interception ---
// --- Key Event Interception ---

const handleKey = (e) => {
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

  if (e.key === 'Enter') {
      // Determine desired action based on Swap state
      // If Swap is ON: 
      //   Enter (no shift) -> Newline (Shift+Enter behavior)
      //   Shift+Enter      -> Submit (Enter behavior)
      
      const isShift = e.shiftKey;
      
      if (isShift) {
          // User pressed Shift+Enter. We want Submit (Enter).
          // Swallow this event and dispatch a plain Enter.
          
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          if (e.type === 'keydown') {
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
                  // Dispatch a synthetic Shift+Enter keydown
                  const shiftEnterDown = new KeyboardEvent('keydown', {
                      key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                      bubbles: true, cancelable: true, composed: true,
                      shiftKey: true, // ADD SHIFT for Newline
                      ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey,
                      view: window
                  });
                  target.dispatchEvent(shiftEnterDown);
                  
                  // Some editors need a keypress too
                  const shiftEnterPress = new KeyboardEvent('keypress', {
                      key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                      bubbles: true, cancelable: true, composed: true,
                      shiftKey: true, 
                      view: window
                  });
                  target.dispatchEvent(shiftEnterPress);

                  // If standard events fail, try inserting a newline text node manually
                  // But carefully, as this desyncs virtual DOMs. 
                  // Let's rely on the events first. If this still fails, 
                  // we might need to simulate 'beforeinput' with insertLineBreak.
                  
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
  }
};

// Use capture phase on window to catch it first
window.addEventListener('keydown', handleKey, true);
window.addEventListener('keypress', handleKey, true);
window.addEventListener('keyup', handleKey, true);
