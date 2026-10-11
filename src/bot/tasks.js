const api = {
  async getStatus() {
    const res = await fetch('/api/status', { headers: { Authorization: `Basic ${btoa('admin:change-me')}` } });
    return res.json();
  },
  async postCommand(text) {
    const res = await fetch('/api/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa('admin:change-me')}`
      },
      body: JSON.stringify({ text })
    });
    return res.json();
  }
};

const state = {
  current: null
};

function renderStatus(data) {
  const info = data?.data?.status || {};
  const statusPill = document.getElementById('statusPill');
  statusPill.textContent = info.status || 'offline';
  statusPill.classList.toggle('online', (info.status || 'offline') === 'online');

  document.getElementById('serverInfo').textContent = `${data?.data?.host || '-'}:${data?.data?.port || '-'}`;
  document.getElementById('pingInfo').textContent = info.ping ?? '-';
  document.getElementById('healthInfo').textContent = info.health ?? '-';
  document.getElementById('foodInfo').textContent = info.food ?? '-';
  document.getElementById('positionInfo').textContent = info.position ? `${info.position.x.toFixed(1)}, ${info.position.y.toFixed(1)}, ${info.position.z.toFixed(1)}` : '-';
  document.getElementById('dimensionInfo').textContent = info.dimension || '-';

  const inventory = data?.data?.inventory || [];
  const inventoryHtml = inventory.length ? inventory.map((item) => `<div>${item.name}: ${item.count}</div>`).join('') : 'No inventory yet';
  document.getElementById('inventoryList').innerHTML = inventoryHtml;

  const logs = data?.data?.logs || [];
  document.getElementById('logBox').innerHTML = logs.slice(-20).map((entry) => `<div class="log-entry ${entry.level}">${entry.timestamp} - ${entry.message}</div>`).join('');

  const tasks = data?.data?.tasks || [];
  document.getElementById('taskList').innerHTML = tasks.length ? tasks.map((task) => `<div>${task.id}: ${task.type}</div>`).join('') : 'No tasks';
}

async function refresh() {
  const result = await api.getStatus();
  state.current = result;
  renderStatus(result);
}

async function sendCommand() {
  const input = document.getElementById('commandInput');
  const value = input.value.trim();
  if (!value) return;
  const result = await api.postCommand(value);
  const logs = document.getElementById('logBox');
  logs.innerHTML += `<div class="log-entry command">command: ${value}</div>`;
  if (result?.ok) {
    logs.innerHTML += `<div class="log-entry success">${JSON.stringify(result.data)}</div>`;
  } else {
    logs.innerHTML += `<div class="log-entry error">${result?.error || 'Request failed'}</div>`;
  }
  input.value = '';
  await refresh();
}

async function runAiTask() {
  const value = document.getElementById('aiInput').value.trim();
  if (!value) return;
  await api.postCommand(value);
  document.getElementById('currentDecision').textContent = `Ran: ${value}`;
  await refresh();
}

async function stopBot() {
  await api.postCommand('!stop');
  await refresh();
}

document.getElementById('sendCommandButton').addEventListener('click', sendCommand);
document.getElementById('runAiButton').addEventListener('click', runAiTask);
document.getElementById('stopBotButton').addEventListener('click', stopBot);
document.getElementById('connectButton').addEventListener('click', async () => {
  const host = document.getElementById('hostInput').value || 'localhost';
  const port = document.getElementById('portInput').value || '25565';
  const username = document.getElementById('usernameInput').value || 'ARVBot';
  const version = document.getElementById('versionInput').value || '1.20.4';
  await api.postCommand(`!connect ${host} ${port}`);
  await refresh();
});
document.getElementById('disconnectButton').addEventListener('click', async () => {
  await api.postCommand('!disconnect');
  await refresh();
});

document.getElementById('commandInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') sendCommand();
});

refresh();
setInterval(refresh, 5000);
