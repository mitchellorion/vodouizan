(() => {
  const SEQUENCE = 'abracadabra';
  const PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

  let typed = '';

  // Listen for the magic word
  document.addEventListener('keydown', (e) => {
    typed += e.key.toLowerCase();
    if (typed.length > SEQUENCE.length) typed = typed.slice(-SEQUENCE.length);
    if (typed === SEQUENCE) {
      typed = '';
      showLoginModal();
    }
  });

  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function injectStyles() {
    if (document.getElementById('admin-styles')) return;
    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.textContent = `
      #admin-overlay {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Inter', sans-serif;
      }
      #admin-box {
        background: #0f0f0f; border: 1px solid #2a2a2a;
        border-radius: 16px; padding: 2.5rem; width: 100%; max-width: 420px;
        box-shadow: 0 0 60px rgba(0,200,200,0.08);
        color: #e0e0e0;
      }
      #admin-box h2 {
        margin: 0 0 0.25rem; font-size: 1.3rem; color: #fff; letter-spacing: 0.02em;
      }
      #admin-box p.sub {
        margin: 0 0 1.75rem; font-size: 0.8rem; color: #555;
      }
      #admin-box input[type="password"] {
        width: 100%; padding: 0.75rem 1rem; border-radius: 8px;
        border: 1px solid #2a2a2a; background: #1a1a1a; color: #fff;
        font-size: 0.95rem; outline: none; box-sizing: border-box;
        transition: border-color 0.2s;
      }
      #admin-box input[type="password"]:focus { border-color: #0cc; }
      #admin-login-btn {
        margin-top: 1rem; width: 100%; padding: 0.75rem;
        background: #0cc; color: #000; border: none; border-radius: 8px;
        font-size: 0.9rem; font-weight: 700; cursor: pointer; letter-spacing: 0.03em;
        transition: background 0.2s;
      }
      #admin-login-btn:hover { background: #0aa; }
      #admin-error {
        margin-top: 0.75rem; font-size: 0.8rem; color: #f55; display: none; text-align: center;
      }
      #admin-close-login {
        margin-top: 1rem; width: 100%; padding: 0.5rem;
        background: transparent; color: #444; border: none;
        font-size: 0.8rem; cursor: pointer;
      }
      #admin-close-login:hover { color: #888; }

      /* Panel */
      #admin-panel {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.9); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Inter', sans-serif;
      }
      #admin-panel-box {
        background: #0f0f0f; border: 1px solid #2a2a2a;
        border-radius: 16px; padding: 2rem; width: 100%; max-width: 640px;
        max-height: 85vh; overflow-y: auto;
        box-shadow: 0 0 80px rgba(0,200,200,0.1);
        color: #e0e0e0;
      }
      #admin-panel-box h2 {
        margin: 0 0 0.2rem; font-size: 1.25rem; color: #fff;
      }
      #admin-panel-box .panel-sub {
        font-size: 0.78rem; color: #444; margin: 0 0 2rem;
      }
      .admin-section { margin-bottom: 2rem; }
      .admin-section h3 {
        font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em;
        color: #0cc; margin: 0 0 0.75rem;
      }
      .admin-links {
        display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;
      }
      .admin-link {
        display: flex; align-items: center; gap: 0.6rem;
        padding: 0.7rem 1rem; border-radius: 8px;
        background: #1a1a1a; border: 1px solid #2a2a2a;
        color: #ccc; text-decoration: none; font-size: 0.85rem;
        transition: all 0.2s;
      }
      .admin-link:hover { border-color: #0cc; color: #fff; background: #1f1f1f; }
      .admin-link .icon { font-size: 1rem; }
      .admin-info {
        display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;
      }
      .admin-info-card {
        background: #1a1a1a; border: 1px solid #2a2a2a;
        border-radius: 8px; padding: 0.75rem 1rem;
        font-size: 0.8rem;
      }
      .admin-info-card .label { color: #555; margin-bottom: 0.2rem; }
      .admin-info-card .value { color: #fff; font-weight: 600; }
      #admin-panel-close {
        width: 100%; padding: 0.65rem; margin-top: 1.5rem;
        background: #1a1a1a; border: 1px solid #2a2a2a;
        border-radius: 8px; color: #555; font-size: 0.8rem;
        cursor: pointer; transition: all 0.2s;
      }
      #admin-panel-close:hover { border-color: #f55; color: #f55; }
    `;
    document.head.appendChild(style);
  }

  function showLoginModal() {
    injectStyles();
    if (document.getElementById('admin-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'admin-overlay';
    overlay.innerHTML = `
      <div id="admin-box">
        <h2>Admin Access</h2>
        <p class="sub">This area is restricted.</p>
        <input type="password" id="admin-pass" placeholder="Password" autocomplete="off" />
        <button id="admin-login-btn">Enter</button>
        <div id="admin-error">Incorrect password.</div>
        <button id="admin-close-login">Cancel</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('admin-pass');
    input.focus();

    document.getElementById('admin-login-btn').addEventListener('click', attemptLogin);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
    document.getElementById('admin-close-login').addEventListener('click', closeLogin);
  }

  async function attemptLogin() {
    const input = document.getElementById('admin-pass');
    const hash = await sha256(input.value);
    if (hash === PASSWORD_HASH) {
      closeLogin();
      showAdminPanel();
    } else {
      document.getElementById('admin-error').style.display = 'block';
      input.value = '';
      input.focus();
    }
  }

  function closeLogin() {
    document.getElementById('admin-overlay')?.remove();
  }

  function showAdminPanel() {
    injectStyles();
    const now = new Date();

    const panel = document.createElement('div');
    panel.id = 'admin-panel';
    panel.innerHTML = `
      <div id="admin-panel-box">
        <h2>Vodouizan Admin</h2>
        <p class="panel-sub">Welcome back, Joey.</p>

        <div class="admin-section">
          <h3>Quick Links</h3>
          <div class="admin-links">
            <a class="admin-link" href="https://app.netlify.com" target="_blank">
              <span class="icon">⚡</span> Netlify Dashboard
            </a>
            <a class="admin-link" href="https://github.com/mitchellorion/vodouizan" target="_blank">
              <span class="icon">🐙</span> GitHub Repo
            </a>
            <a class="admin-link" href="https://search.google.com/search-console" target="_blank">
              <span class="icon">🔍</span> Search Console
            </a>
            <a class="admin-link" href="https://analytics.google.com" target="_blank">
              <span class="icon">📊</span> Analytics
            </a>
            <a class="admin-link" href="https://vodouizan.com/sitemap.xml" target="_blank">
              <span class="icon">🗺️</span> Sitemap
            </a>
            <a class="admin-link" href="mailto:hello@vodouizan.com">
              <span class="icon">✉️</span> Email Inbox
            </a>
          </div>
        </div>

        <div class="admin-section">
          <h3>Site Info</h3>
          <div class="admin-info">
            <div class="admin-info-card">
              <div class="label">Current Page</div>
              <div class="value">${window.location.pathname}</div>
            </div>
            <div class="admin-info-card">
              <div class="label">Session Time</div>
              <div class="value">${now.toLocaleTimeString()}</div>
            </div>
            <div class="admin-info-card">
              <div class="label">Date</div>
              <div class="value">${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
            <div class="admin-info-card">
              <div class="label">Host</div>
              <div class="value">${window.location.hostname}</div>
            </div>
          </div>
        </div>

        <button id="admin-panel-close">Close Panel</button>
      </div>
    `;
    document.body.appendChild(panel);
    document.getElementById('admin-panel-close').addEventListener('click', () => panel.remove());
  }
})();
