let swapEnter = true;
let switchUI = null;

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
        height: 100%;
        margin-right: 8px;
    `;
    
    container.onmouseover = () => container.style.opacity = '1';
    container.onmouseout = () => container.style.opacity = '0.7';

    // Label
    const labelText = document.createElement('span');
    labelText.textContent = 'Enter: ';
    labelText.style.marginRight = '2px';
    container.appendChild(labelText);

    // Send Icon
    const sendIcon = document.createElement('span');
    sendIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
    sendIcon.style.display = 'flex';
    sendIcon.title = 'Send behavior';
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
    newlineIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7h-2z"/></svg>`;
    newlineIcon.style.display = 'flex';
    newlineIcon.title = 'Newline behavior';
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
function inject() {
    let ui = document.getElementById('gemini-enter-fix-switch');
    if (!ui) {
        ui = createSwitchUI();
    }

    // Strategy: Ensure custom UI is the FIRST child of `.trailing-actions-wrapper`
    // This container holds [ModelPicker (Fast)] and [MicWrapper].
    
    // 1. Locate the container
    let container = document.querySelector('.trailing-actions-wrapper');
    
    // 2. Fallback: Try locating via the "Fast" button
    if (!container) {
        const switchBtn = document.querySelector('button.input-area-switch');
        if (switchBtn) {
            container = switchBtn.closest('.trailing-actions-wrapper');
        }
    }
    
    // 3. Fallback: Deep search via Mic wrapper
    if (!container) {
        const micWrapper = document.querySelector('.input-buttons-wrapper-bottom');
        if (micWrapper && micWrapper.parentNode) {
            // Check if this parent looks like the right toolbar (has multiple children)
            if (micWrapper.parentNode.children.length > 0) {
                container = micWrapper.parentNode;
            }
        }
    }

    // Apply Placement
    if (container) {
        // Enforce position: Must be the very first child.
        if (container.firstElementChild !== ui) {
            container.insertBefore(ui, container.firstElementChild);
        }
    }
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
// Periodic check to assume authority over position against framework re-renders
setInterval(inject, 2000);

// --- Key Event Interception ---
document.addEventListener('keydown', (e) => {
  if (!swapEnter) return;
  if (!e.isTrusted) return;

  const target = e.target;
  const isInput = target.isContentEditable || target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target.type === 'text');
  if (!isInput) return;

  if (e.key === 'Enter') {
      if (!e.shiftKey) {
          // Enter -> Newline (Simulate Shift+Enter)
          e.preventDefault();
          e.stopPropagation();

          const newEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true,
              composed: true,
              shiftKey: true,
              ctrlKey: e.ctrlKey,
              altKey: e.altKey,
              metaKey: e.metaKey
          });
          target.dispatchEvent(newEvent);
      } else {
          // Shift+Enter -> Submit (Simulate Enter)
          e.preventDefault();
          e.stopPropagation();

          const newEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
            composed: true,
            shiftKey: false,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            metaKey: e.metaKey
        });
        target.dispatchEvent(newEvent);
      }
  }
}, true); // Capture phase to intervene before site logic
