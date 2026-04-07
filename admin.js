(() => {
  const SEQUENCE = 'abracadabra';
  const PASSWORD_HASH = '2c0e7d9166f0a86639d5606f052289786184acbe8aeaed13473da59f948056fc';

  let typed = '';

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
        background: #020c10; border: 1px solid #1a3a3a;
        border-radius: 16px; padding: 2.5rem; width: 100%; max-width: 420px;
        box-shadow: 0 0 60px rgba(94,232,232,0.08);
        color: #e0e0e0;
      }
      #admin-box h2 { margin: 0 0 0.25rem; font-size: 1.3rem; color: #7df4f4; }
      #admin-box p.sub { margin: 0 0 1.75rem; font-size: 0.8rem; color: #445; }
      #admin-box input[type="password"] {
        width: 100%; padding: 0.75rem 1rem; border-radius: 8px;
        border: 1px solid #1a3a3a; background: #040f15; color: #fff;
        font-size: 0.95rem; outline: none; box-sizing: border-box;
        transition: border-color 0.2s;
      }
      #admin-box input[type="password"]:focus { border-color: #7df4f4; }
      #admin-login-btn {
        margin-top: 1rem; width: 100%; padding: 0.75rem;
        background: #7df4f4; color: #020c10; border: none; border-radius: 8px;
        font-size: 0.9rem; font-weight: 700; cursor: pointer;
        transition: background 0.2s;
      }
      #admin-login-btn:hover { background: #4ad4d4; }
      #admin-error { margin-top: 0.75rem; font-size: 0.8rem; color: #f55; display: none; text-align: center; }
      #admin-close-login {
        margin-top: 1rem; width: 100%; padding: 0.5rem;
        background: transparent; color: #334; border: none; font-size: 0.8rem; cursor: pointer;
      }
      #admin-close-login:hover { color: #888; }

      #admin-panel {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.92); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Inter', sans-serif;
      }
      #admin-panel-box {
        background: #020c10; border: 1px solid #1a3a3a;
        border-radius: 16px; padding: 2rem; width: 100%; max-width: 640px;
        max-height: 85vh; overflow-y: auto;
        box-shadow: 0 0 80px rgba(94,232,232,0.1);
        color: #e0e0e0;
      }
      #admin-panel-box h2 { margin: 0 0 0.2rem; font-size: 1.25rem; color: #7df4f4; }
      #admin-panel-box .panel-sub { font-size: 0.78rem; color: #334; margin: 0 0 2rem; }
      .admin-section { margin-bottom: 2rem; }
      .admin-section h3 {
        font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em;
        color: #7df4f4; margin: 0 0 0.75rem; opacity: 0.7;
      }
      .admin-links { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
      .admin-link {
        display: flex; align-items: center; gap: 0.6rem;
        padding: 0.7rem 1rem; border-radius: 8px;
        background: #040f15; border: 1px solid #1a3a3a;
        color: #aaa; text-decoration: none; font-size: 0.85rem;
        transition: all 0.2s; cursor: pointer;
      }
      .admin-link:hover { border-color: #7df4f4; color: #fff; }
      .admin-link .icon { font-size: 1rem; }
      .admin-link.highlight {
        border-color: #7df4f4; color: #7df4f4; background: rgba(94,232,232,0.05);
      }
      .admin-link.highlight:hover { background: rgba(94,232,232,0.12); }
      .admin-info { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
      .admin-info-card {
        background: #040f15; border: 1px solid #1a3a3a;
        border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.8rem;
      }
      .admin-info-card .label { color: #334; margin-bottom: 0.2rem; }
      .admin-info-card .value { color: #7df4f4; font-weight: 600; }
      #admin-panel-close {
        width: 100%; padding: 0.65rem; margin-top: 1.5rem;
        background: #040f15; border: 1px solid #1a3a3a;
        border-radius: 8px; color: #334; font-size: 0.8rem;
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
    if (isLockedOut()) {
      const until = new Date(parseInt(localStorage.getItem(LOCKOUT_KEY), 10));
      document.getElementById('admin-error').textContent = `Too many attempts. Try again after ${until.toLocaleTimeString()}.`;
      document.getElementById('admin-error').style.display = 'block';
      document.getElementById('admin-login-btn').disabled = true;
      input.disabled = true;
    }
    input.focus();
    document.getElementById('admin-login-btn').addEventListener('click', attemptLogin);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
    document.getElementById('admin-close-login').addEventListener('click', closeLogin);
  }

  const LOCKOUT_KEY  = '_adm_lk';
  const ATTEMPTS_KEY = '_adm_at';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS   = 15 * 60 * 1000; // 15 minutes

  function isLockedOut() {
    const until = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    return Date.now() < until;
  }

  function recordFailedAttempt() {
    const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
    localStorage.setItem(ATTEMPTS_KEY, attempts);
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem(LOCKOUT_KEY, Date.now() + LOCKOUT_MS);
      localStorage.setItem(ATTEMPTS_KEY, '0');
      return true; // just locked out
    }
    return false;
  }

  async function attemptLogin() {
    if (isLockedOut()) {
      const until = new Date(parseInt(localStorage.getItem(LOCKOUT_KEY), 10));
      const errEl = document.getElementById('admin-error');
      errEl.textContent = `Too many attempts. Try again after ${until.toLocaleTimeString()}.`;
      errEl.style.display = 'block';
      return;
    }

    const input = document.getElementById('admin-pass');
    const hash  = await sha256(input.value);
    if (hash === PASSWORD_HASH) {
      localStorage.setItem(ATTEMPTS_KEY, '0');
      closeLogin();
      showAdminPanel();
    } else {
      const lockedNow = recordFailedAttempt();
      const errEl = document.getElementById('admin-error');
      if (lockedNow) {
        errEl.textContent = 'Too many failed attempts. Locked for 15 minutes.';
      } else {
        const left = MAX_ATTEMPTS - parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10);
        errEl.textContent = `Incorrect password. ${left} attempt${left !== 1 ? 's' : ''} remaining.`;
      }
      errEl.style.display = 'block';
      input.value = '';
      input.focus();
    }
  }

  function closeLogin() { document.getElementById('admin-overlay')?.remove(); }

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
          <h3>Content</h3>
          <div class="admin-links">
            <a class="admin-link highlight" href="admin-editor.html">
              <span class="icon">✍️</span> Build Article
            </a>
            <a class="admin-link" href="admin-drafts.html">
              <span class="icon">📄</span> Articles
            </a>
          </div>
        </div>

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
