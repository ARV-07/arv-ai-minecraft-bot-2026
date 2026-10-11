// ============================================
// STORAGE & INITIALIZATION
// ============================================

const STORAGE_KEY = 'minecraft_bot_config';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupTabNavigation();
    loadAllData();
    setupFormSubmissions();
});

// ============================================
// TAB NAVIGATION
// ============================================

function setupTabNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');

            // Remove active class from all
            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            // Add active class to clicked
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

function getConfig() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getDefaultConfig();
}

function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    showMessage('Configuration saved successfully!', 'success');
}

function getDefaultConfig() {
    return {
        botInfo: {
            name: '',
            version: '',
            mcVersion: '1.20.1',
            description: '',
            owner: '',
            createdDate: '',
            prefix: '!',
        },
        discord: {
            token: '',
            clientId: '',
            guildId: '',
            statusType: 'PLAYING',
            statusText: '',
            intents: '',
            autoRestart: true,
        },
        console: {
            logLevel: 'INFO',
            saveToFile: true,
            logs: [],
        },
        advanced: {
            javaArgs: '-Xmx1024M -Xms512M',
            maxPlayers: 20,
            port: 25565,
            aiModel: 'gpt-3.5',
            apiKey: '',
            persistentMemory: true,
            commandLogging: true,
        },
    };
}

// ============================================
// LOAD DATA INTO FORMS
// ============================================

function loadAllData() {
    const config = getConfig();
    loadBotInfo(config.botInfo);
    loadDiscordSetup(config.discord);
    loadConsole(config.console);
    loadAdvanced(config.advanced);
    updateOverview(config);
}

function loadBotInfo(botInfo) {
    document.getElementById('botName').value = botInfo.name || '';
    document.getElementById('botVersion').value = botInfo.version || '';
    document.getElementById('mcVersion').value = botInfo.mcVersion || '1.20.1';
    document.getElementById('botDescription').value = botInfo.description || '';
    document.getElementById('owner').value = botInfo.owner || '';
    document.getElementById('createdDate').value = botInfo.createdDate || '';
    document.getElementById('prefix').value = botInfo.prefix || '!';
}

function loadDiscordSetup(discord) {
    document.getElementById('token').value = discord.token || '';
    document.getElementById('clientId').value = discord.clientId || '';
    document.getElementById('guildId').value = discord.guildId || '';
    document.getElementById('statusType').value = discord.statusType || 'PLAYING';
    document.getElementById('statusText').value = discord.statusText || '';
    document.getElementById('intents').value = discord.intents || '';
    document.getElementById('autoRestart').checked = discord.autoRestart !== false;
}

function loadConsole(console_) {
    document.getElementById('logLevel').value = console_.logLevel || 'INFO';
    document.getElementById('saveToFile').checked = console_.saveToFile !== false;

    // Populate console output
    const consoleOutput = document.getElementById('console');
    consoleOutput.innerHTML = '';
    if (console_.logs && console_.logs.length > 0) {
        console_.logs.forEach(log => {
            addConsoleLog(log.message, log.type);
        });
    }
}

function loadAdvanced(advanced) {
    document.getElementById('javaArgs').value = advanced.javaArgs || '';
    document.getElementById('maxPlayers').value = advanced.maxPlayers || 20;
    document.getElementById('port').value = advanced.port || 25565;
    document.getElementById('aiModel').value = advanced.aiModel || 'gpt-3.5';
    document.getElementById('apiKey').value = advanced.apiKey || '';
    document.getElementById('persistentMemory').checked = advanced.persistentMemory !== false;
    document.getElementById('commandLogging').checked = advanced.commandLogging !== false;
}

function updateOverview(config) {
    document.getElementById('botStatus').textContent = config.botInfo.name ? 'Online' : 'Offline';
    document.getElementById('versionDisplay').textContent = config.botInfo.version || 'Not Set';
    document.getElementById('discordStatus').textContent = config.discord.token ? 'Yes' : 'No';
    document.getElementById('memoryUsage').textContent = Math.floor(Math.random() * 80) + '%';
}

// ============================================
// FORM SUBMISSIONS
// ============================================

function setupFormSubmissions() {
    document.getElementById('botForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const config = getConfig();
        config.botInfo = {
            name: document.getElementById('botName').value,
            version: document.getElementById('botVersion').value,
            mcVersion: document.getElementById('mcVersion').value,
            description: document.getElementById('botDescription').value,
            owner: document.getElementById('owner').value,
            createdDate: document.getElementById('createdDate').value,
            prefix: document.getElementById('prefix').value,
        };
        saveConfig(config);
        updateOverview(config);
    });

    document.getElementById('discordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const config = getConfig();
        config.discord = {
            token: document.getElementById('token').value,
            clientId: document.getElementById('clientId').value,
            guildId: document.getElementById('guildId').value,
            statusType: document.getElementById('statusType').value,
            statusText: document.getElementById('statusText').value,
            intents: document.getElementById('intents').value,
            autoRestart: document.getElementById('autoRestart').checked,
        };
        saveConfig(config);
        updateOverview(config);
    });

    document.getElementById('logForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const config = getConfig();
        config.console = {
            logLevel: document.getElementById('logLevel').value,
            saveToFile: document.getElementById('saveToFile').checked,
            logs: config.console.logs || [],
        };
        saveConfig(config);
    });

    document.getElementById('advancedForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const config = getConfig();
        config.advanced = {
            javaArgs: document.getElementById('javaArgs').value,
            maxPlayers: parseInt(document.getElementById('maxPlayers').value),
            port: parseInt(document.getElementById('port').value),
            aiModel: document.getElementById('aiModel').value,
            apiKey: document.getElementById('apiKey').value,
            persistentMemory: document.getElementById('persistentMemory').checked,
            commandLogging: document.getElementById('commandLogging').checked,
        };
        saveConfig(config);
    });
}

// ============================================
// CONSOLE FUNCTIONS
// ============================================

function addConsoleLog(message, type = 'info') {
    const console_ = document.getElementById('console');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = `[${type.toUpperCase()}] ${message}`;
    console_.appendChild(line);

    // Auto-scroll if enabled
    if (document.getElementById('autoScroll').checked) {
        console_.scrollTop = console_.scrollHeight;
    }

    // Store in config
    const config = getConfig();
    if (!config.console.logs) config.console.logs = [];
    config.console.logs.push({ message, type, timestamp: new Date().toISOString() });
    // Keep only last 1000 logs
    if (config.console.logs.length > 1000) {
        config.console.logs = config.console.logs.slice(-1000);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function handleCommand(event) {
    if (event.key === 'Enter') {
        sendCommand();
    }
}

function sendCommand() {
    const input = document.getElementById('commandInput');
    const command = input.value.trim();

    if (!command) return;

    addConsoleLog(`> ${command}`, 'debug');
    input.value = '';

    // Simulate command execution
    setTimeout(() => {
        if (command.toLowerCase() === 'help') {
            addConsoleLog('Available commands: help, status, restart, stop', 'info');
        } else if (command.toLowerCase() === 'status') {
            addConsoleLog('Bot Status: Online | Players: 5/20 | Memory: 45%', 'info');
        } else if (command.toLowerCase() === 'restart') {
            addConsoleLog('Restarting bot...', 'warning');
            setTimeout(() => addConsoleLog('Bot restarted successfully', 'info'), 1000);
        } else if (command.toLowerCase() === 'stop') {
            addConsoleLog('Stopping bot...', 'warning');
            setTimeout(() => addConsoleLog('Bot stopped', 'info'), 1000);
        } else {
            addConsoleLog(`Unknown command: ${command}`, 'error');
        }
    }, 300);
}

function clearConsole() {
    document.getElementById('console').innerHTML = '';
    const config = getConfig();
    config.console.logs = [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    addConsoleLog('Console cleared', 'info');
}

function downloadLogs() {
    const config = getConfig();
    const logs = config.console.logs || [];
    const content = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function toggleTokenVisibility() {
    const input = document.getElementById('token');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function toggleKeyVisibility() {
    const input = document.getElementById('apiKey');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `${type}-message`;
    messageEl.textContent = message;
    
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageEl, mainContent.firstChild);

    setTimeout(() => messageEl.remove(), 3000);
}

function resetConfig() {
    if (confirm('Are you sure? This will reset ALL configuration!')) {
        localStorage.removeItem(STORAGE_KEY);
        loadAllData();
        showMessage('Configuration reset to default', 'success');
    }
}

function exportConfig() {
    const config = getConfig();
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    addConsoleLog('Configuration exported', 'info');
}

function importConfig() {
    const input = document.getElementById('configFile');
    input.click();
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target.result);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
                loadAllData();
                showMessage('Configuration imported successfully!', 'success');
                addConsoleLog('Configuration imported', 'info');
            } catch (err) {
                showMessage('Failed to import configuration', 'error');
                addConsoleLog(`Import error: ${err.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }, { once: true });
}
