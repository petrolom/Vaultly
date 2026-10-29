masterKey = null;

let entriesBackup = [];

let userSalt = null;

async function createAccount() {
  const res = await fetch('php/create_account.php');
  const j = await res.json();
  if (j.status === 'ok') {
    masterKey = j.hash;
    document.getElementById('accountInit').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';

    const regSection = document.getElementById('registerSection');
    regSection.innerHTML = `
      <h3>Register</h3>
      <div style="margin-bottom:12px;">
        <strong>Your Master Key (save securely):</strong><br>
        <input id="masterKeyDisplay" value="${masterKey}" readonly style="width:100%;font-weight:bold;margin:8px 0;" />
        <button onclick="copyMasterKey()" style="width:auto;">Copy Master Key</button>
        <div style="font-size:13px;color:#e53935;margin-top:6px;">
          You need this key to recover your vault. Save it in a safe place!
        </div>
      </div>
      <input id="regUsername" placeholder="Choose username" />
      <input id="regEmail" placeholder="Your email for 2FA" />
      <div style="position:relative;">
        <input id="regPassword" type="password" placeholder="Choose password" oninput="showPasswordStrength(this.value)" />
        <span class="reveal" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:1.5em;" onclick="toggleInputPassword('regPassword', this)">👁</span>
      </div>
      <div id="passwordStrength" style="margin-bottom:8px;"></div>
      <button onclick="registerUser()">Create Vault</button>
      <button onclick="goBack()">← Back</button>
    `;
  } else {
    alert(j.error);
  }
}

function copyMasterKey() {
  const input = document.getElementById('masterKeyDisplay');
  input.select();
  input.setSelectionRange(0, 99999);
  document.execCommand('copy');
}

async function registerUser() {
  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const res = await fetch('php/register_user.php', {
    method: 'POST',
    body: new URLSearchParams({ username, email, password, hash: masterKey })
  });
  const j = await res.json();
  if (j.status === 'ok') {
    alert("Account created! Please log in.");
    showLogin();
  } else alert(j.error);
}

async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const code2fa = document.getElementById('login2fa').value;
  const res = await fetch('php/login.php', {
    method: 'POST',
    body: new URLSearchParams({ username, password, code2fa }) 
  });
  const j = await res.json();
  if (j.status === 'ok') {
    masterKey = j.masterKey || null;

    userSalt = j.salt;

    showVault();
  } else alert(j.error);
}

function logout() {
  location.reload();
}

function showLogin() {
  document.querySelectorAll('#accountInit, #registerSection, #helpSection, #vault').forEach(el => el.style.display = 'none');
  document.getElementById('loginSection').style.display = 'block';
}

function showHelp() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('helpSection').style.display = 'block';
}

async function resetPassword() {
  const hashInput = document.getElementById('resetMasterKey');
  const newPassInput = document.getElementById('resetNewPassword');
  const hash = hashInput.value;
  const newPass = newPassInput.value;
  const res = await fetch('php/reset_password.php', {
    method: 'POST',
    body: new URLSearchParams({ hash, newPass })
  });
  const j = await res.json();
  alert(j.status === 'ok' ? "Password reset!" : j.error);
  hashInput.value = '';
  newPassInput.value = '';
}

async function getUsername() {
  const hash = document.getElementById('lookupMasterKey').value;
  const res = await fetch('php/get_username.php', {
    method: 'POST',
    body: new URLSearchParams({ hash })
  });
  const j = await res.json();
  alert(j.status === 'ok' ? "Your username: " + j.username : j.error);
}

function goBack() {
  document.querySelectorAll('#registerSection, #loginSection, #helpSection').forEach(el => el.style.display = 'none');
  document.getElementById('accountInit').style.display = 'block';
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 300000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(text, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await deriveKey(key, userSalt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(text)
  );
  const ivStr = btoa(String.fromCharCode(...iv));
  const dataStr = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  return ivStr + "::" + dataStr;
}

async function decrypt(encoded, key) {
  const [ivB64, dataB64] = encoded.split('::');
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(dataB64), c => c.charCodeAt(0));
  const cryptoKey = await deriveKey(key, userSalt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  return new TextDecoder().decode(decrypted);
}



async function saveEntry() {
  const nameInput = document.getElementById('entryName');
  const userInput = document.getElementById('entryUser');
  const passInput = document.getElementById('entryPass');
  const name = nameInput.value;
  const user = userInput.value;
  const pass = passInput.value;
  const encryptedPass = await encrypt(pass, masterKey);
  await fetch('php/save_entry.php', {
    method: 'POST',
    body: new URLSearchParams({ name, user, pass: encryptedPass })
  });
  await loadEntries();

  nameInput.value = '';
  userInput.value = '';
  passInput.value = '';
}

async function loadEntries() {
  const res = await fetch('php/load_entries.php');
  const j = await res.json();
  entriesBackup = j.entries.sort((a, b) => 
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
  await renderFiltered('');
}

async function renderFiltered(query) {
  const container = document.getElementById('entries');
  container.innerHTML = '';

  for (const e of entriesBackup
    .filter(e => e.name.toLowerCase().includes(query.toLowerCase()) || e.user.toLowerCase().includes(query.toLowerCase()))) {
    const div = document.createElement('div');
    div.className = 'entry';
    let passText = '********';
    if (e.pass && e.pass.includes('::')) {
      try {
        passText = await decrypt(e.pass, masterKey);
      } catch {
        passText = '[Fehler]';
      }
    }
    div.innerHTML = `
      <span class="entry-name">${e.name}</span>
      <span class="entry-user">${e.user}</span>
      <span class="entry-pass password-hidden" id="pass-${e.id}">${passText}</span>
      <span class="reveal" onclick="togglePassword('${e.id}')">👁</span>
      <button class="delete" onclick="deleteEntry('${e.id}')">Delete</button>
    `;
    container.appendChild(div);
  }
}

async function togglePassword(id) {
  const span = document.getElementById('pass-' + id);

  if (!span.classList.contains('password-hidden')) {
    span.classList.add('password-hidden');
    return;
  }

  document.querySelectorAll('[id^="pass-"]').forEach(otherSpan => {
    if (!otherSpan.classList.contains('password-hidden')) {
      otherSpan.classList.add('password-hidden');
    }
  });

  const entry = entriesBackup.find(e => e.id === id);
  if (!entry) return;

  if (!entry.pass.includes('::')) {
    alert('Dieses Passwort ist nicht entschlüsselt gespeichert und kann nicht angezeigt werden.');
    return;
  }

  const real = await decrypt(entry.pass, masterKey);
  span.textContent = real;
  span.classList.remove('password-hidden');
}

async function deleteEntry(id) {
  if (!confirm("Are you sure to delete this?")) return;
  await fetch('php/delete_entry.php', {
    method: 'POST',
    body: new URLSearchParams({ id })
  });
  loadEntries();
}


function showVault() {
  document.querySelectorAll('#accountInit, #registerSection, #loginSection, #helpSection').forEach(el => el.style.display = 'none');
  const vault = document.getElementById('vault');
  vault.style.display = 'block';

  vault.innerHTML = `
    <h3>Your Vault</h3>
    <input class="search" id="searchInput" placeholder="Search..." oninput="renderFiltered(this.value)" />
    <div id="entries"></div>
    <input id="entryName" placeholder="Entry Name" />
    <input id="entryUser" placeholder="Username/Email" />
    <input id="entryPass" placeholder="Password" type="password" />
    <button onclick="saveEntry()">Save Entry</button>
    <button onclick="logout()">Logout</button>
  `;

  loadEntries();
}

function showPasswordStrength(password) {
  const strengthDiv = document.getElementById('passwordStrength');
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  let msg = '';
  let color = '';
  switch (strength) {
    case 0:
    case 1:
      msg = 'Very Weak';
      color = '#e53935';
      break;
    case 2:
      msg = 'Weak';
      color = '#ff9800';
      break;
    case 3:
      msg = 'Medium';
      color = '#fbc02d';
      break;
    case 4:
      msg = 'Strong';
      color = '#43a047';
      break;
    case 5:
      msg = 'Very Strong';
      color = '#2e7d32';
      break;
  }
  strengthDiv.textContent = msg;
  strengthDiv.style.color = color;
}

async function request2FACode() {
  const username = document.getElementById('loginUsername').value;
  const res = await fetch('php/send_2fa_code.php', {
    method: 'POST',
    body: new URLSearchParams({ username })
  });
  const j = await res.json();
  alert(j.status === 'ok' ? "2FA code sent to your email!" : j.error);
}

function toggleInputPassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "🙈";
  } else {
    input.type = "password";
    icon.textContent = "👁";
  }
}

