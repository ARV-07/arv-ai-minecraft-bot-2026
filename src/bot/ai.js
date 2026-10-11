const fs = require('fs');
const path = require('path');
const { createBot } = require('mineflayer');
const { pathfinder, GoalNear, GoalFollow } = require('mineflayer-pathfinder');

const ITEM_ALIASES = {
  oak_log: ['oak_log', 'oaklog', 'log'],
  iron_ore: ['iron_ore', 'ironore', 'ore_iron'],
  diamond_ore: ['diamond_ore', 'diamondore', 'ore_diamond'],
  coal_ore: ['coal_ore', 'coalore'],
  dirt: ['dirt'],
  sand: ['sand'],
  stone: ['stone'],
  iron_pickaxe: ['iron_pickaxe', 'ironpickaxe'],
  iron_ingot: ['iron_ingot', 'ironingot'],
  oak_planks: ['oak_planks', 'oakplanks'],
  cooked_beef: ['cooked_beef', 'cookedbeef'],
  bread: ['bread'],
  apple: ['apple'],
  diamond: ['diamond']
};

class MemoryStore {
  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'memory.db');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = require('better-sqlite3')(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS memory (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        payload TEXT
      );
    `);
  }

  getSetting(key, fallback = null) {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : fallback;
  }

  setSetting(key, value) {
    this.db.prepare('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value));
  }

  getMemory(key, fallback = null) {
    const row = this.db.prepare('SELECT value FROM memory WHERE key = ?').get(key);
    return row ? row.value : fallback;
  }

  setMemory(key, value) {
    this.db.prepare('INSERT INTO memory(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value));
  }

  saveTask(task) {
    this.db.prepare('INSERT INTO tasks(id, payload) VALUES(?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload').run(task.id, JSON.stringify(task));
  }

  getTasks() {
    return this.db.prepare('SELECT payload FROM tasks ORDER BY rowid DESC').all().map(row => JSON.parse(row.payload));
  }

  deleteTask(id) {
    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }
}

class BotManager {
  constructor({ host, port, username, version, auth, reconnect, reconnectDelay, retryLimit, memory }) {
    this.host = host;
    this.port = port;
    this.username = username;
    this.version = version;
    this.auth = auth;
    this.reconnect = reconnect;
    this.reconnectDelay = reconnectDelay;
    this.retryLimit = retryLimit;
    this.memory = memory;
    this.bot = null;
    this.logs = [];
    this.connectionAttempts = 0;
    this.connected = false;
    this.reconnectTimer = null;
    this.status = {
      status: 'offline',
      ping: null,
      position: null,
      dimension: 'unknown',
      health: 20,
      food: 20,
      inventory: [],
      currentTask: null
    };
  }

  addLog(message, level = 'info') {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    this.logs.push(entry);
    if (this.logs.length > 200) this.logs.shift();
    return entry;
  }

  getLogs() {
    return this.logs;
  }

  getState() {
    return {
      connected: this.connected,
      host: this.host,
      port: this.port,
      username: this.username,
      version: this.version,
      auth: this.auth,
      status: this.status,
      logs: this.logs.slice(-50)
    };
  }

  isConnected() {
    return !!this.bot && this.connected;
  }

  async connect() {
    if (this.bot && this.connected) {
      return this.bot;
    }

    this.connectionAttempts += 1;
    this.addLog(`Attempting connection to ${this.host}:${this.port} as ${this.username}`, 'info');

    this.bot = createBot({
      host: this.host,
      port: this.port,
      username: this.username,
      version: this.version,
      auth: this.auth,
      skipValidation: false,
      // disable if not using local offline server; still safe for Java servers with accepted auth
      checkTimeoutInterval: 20000
    });

    this.bot.loadPlugin(pathfinder);

    this.bot.on('login', () => {
      this.connected = true;
      this.status.status = 'online';
      this.addLog(`Connected to ${this.host}:${this.port}`, 'success');
      this.connectionAttempts = 0;
      this.memory.setMemory('last_connection_status', 'connected');
    });

    this.bot.on('spawn', () => {
      this.status.dimension = this.bot.game.dimension || 'overworld';
      this.status.position = this.bot.entity.position;
      this.addLog('Bot spawned successfully', 'info');
    });

    this.bot.on('health', () => {
      this.status.health = this.bot.health;
      this.status.food = this.bot.food;
    });

    this.bot.on('move', () => {
      if (this.bot.entity) {
        this.status.position = this.bot.entity.position;
      }
    });

    this.bot.on('messagestr', (message) => {
      this.addLog(`Server chat: ${message}`, 'info');
    });

    this.bot.on('error', (err) => {
      this.connected = false;
      this.status.status = 'error';
      this.addLog(`Connection error: ${err.message || err}`, 'error');
      this.handleReconnect();
    });

    this.bot.on('end', (reason) => {
      this.connected = false;
      this.status.status = 'offline';
      this.addLog(`Disconnected: ${reason || 'unknown reason'}`, 'warning');
      this.handleReconnect();
    });

    this.bot.on('chat', (username, message) => {
      this.addLog(`${username}: ${message}`, 'info');
    });

    this.bot.on('physicsTick', () => {
      if (this.bot.entity) {
        this.status.position = this.bot.entity.position;
        this.status.dimension = this.bot.game.dimension || 'overworld';
      }
      if (this.bot._client) {
        this.status.ping = this.bot._client.socket && this.bot._client.socket.readyState === 'open'
          ? this.bot._client.latency
          : null;
      }
    });

    this.bot.on('kicked', (reason) => {
      this.connected = false;
      this.status.status = 'kicked';
      this.addLog(`Kicked from server: ${reason}`, 'error');
      this.handleReconnect();
    });

    this.bot.on('death', () => {
      this.addLog('Bot died. Recovery logic should run before continuing.', 'warning');
    });

    return this.bot;
  }

  async disconnect() {
    if (!this.bot) return;
    this.connected = false;
    this.status.status = 'offline';
    this.addLog('Disconnecting bot', 'info');
    this.bot.quit();
    this.bot = null;
  }

  handleReconnect() {
    if (!this.reconnect) return;
    if (this.connectionAttempts >= this.retryLimit) {
      this.addLog(`Retry limit reached (${this.retryLimit}). Stopping automatic reconnect.`, 'error');
      return;
    }

    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      this.addLog(`Reconnecting in ${this.reconnectDelay}ms`, 'info');
      try {
        await this.connect();
      } catch (error) {
        this.addLog(`Reconnect failed: ${error.message}`, 'error');
      }
    }, this.reconnectDelay);
  }

  sendMessage(text) {
    if (!this.bot || !this.connected) {
      throw new Error('Bot is not connected');
    }
    this.bot.chat(text);
  }

  getInventorySummary() {
    if (!this.bot || !this.bot.inventory) return [];
    const entries = {};
    for (const item of this.bot.inventory.slots) {
      if (!item || !item.name) continue;
      entries[item.name] = (entries[item.name] || 0) + item.count;
    }
    return Object.entries(entries).map(([name, count]) => ({ name, count }));
  }

  getEquipment() {
    if (!this.bot) return [];
    return Object.entries(this.bot.inventory.slots.filter(Boolean).slice(0, 10)).map(([key, item]) => ({ key, item }));
  }

  normalizeItemName(raw) {
    const cleaned = String(raw || '').trim().toLowerCase().replace(/\s+/g, '_');
    for (const [canonical, variants] of Object.entries(ITEM_ALIASES)) {
      if (variants.includes(cleaned) || canonical === cleaned) return canonical;
    }
    return cleaned;
  }

  async safeMoveTo(x, y, z) {
    if (!this.bot) throw new Error('Bot is not connected');
    if (!this.bot.pathfinder) throw new Error('Pathfinder not loaded');
    this.bot.pathfinder.setGoal(new GoalNear(x, y, z, 2));
    this.addLog(`Moving to ${x}, ${y}, ${z}`, 'info');
  }

  async followPlayer(playerName) {
    if (!this.bot) throw new Error('Bot is not connected');
    if (!this.bot.pathfinder) throw new Error('Pathfinder not loaded');
    const target = playerName && playerName !== 'self' ? this.bot.players[playerName] : this.bot.players[this.username];
    const entity = target && target.entity ? target.entity : null;
    if (!entity) {
      throw new Error(`Player "${playerName || this.username}" is not nearby`);
    }
    this.bot.pathfinder.setGoal(new GoalFollow(entity, 2));
    this.addLog(`Following ${playerName || 'self'}`, 'info');
  }

  async stopMovement() {
    if (!this.bot || !this.bot.pathfinder) return;
    this.bot.pathfinder.setGoal(null);
    this.addLog('Movement stopped', 'info');
  }

  async mineBlock(blockName, quantity = 1) {
    if (!this.bot) throw new Error('Bot is not connected');
    const name = this.normalizeItemName(blockName);
    let mined = 0;
    while (mined < quantity) {
      const target = this.bot.findBlock({
        matching: (block) => block && block.name === name,
        maxDistance: 32
      });
      if (!target) {
        throw new Error(`No reachable ${name} block found nearby`);
      }
      const block = this.bot.blockAt(target)
      if (!block || block.name !== name) {
        throw new Error(`Target ${name} not valid at location`);
      }
      await this.bot.dig(target);
      mined += 1;
      this.addLog(`Mined ${name} (${mined}/${quantity})`, 'info');
    }
    return mined;
  }

  async collectItem(itemName, quantity = 1) {
    const normalized = this.normalizeItemName(itemName);
    const existing = this.bot.inventory.items().find((item) => item.name === normalized);
    if (existing && existing.count >= quantity) {
      return existing.count;
    }
    const picked = await this.mineBlock(normalized, quantity);
    return picked;
  }

  async craftItem(itemName, quantity = 1) {
    if (!this.bot) throw new Error('Bot is not connected');
    const name = this.normalizeItemName(itemName);
    const recipes = this.bot.recipesFor(name, null, 1, null);
    if (!recipes || !recipes.length) {
      throw new Error(`No recipe found for ${name}`);
    }
    const recipe = recipes[0];
    try {
      await this.bot.craft(recipe, quantity, null);
      this.addLog(`Crafted ${quantity} ${name}`, 'info');
      return true;
    } catch (error) {
      throw new Error(`Could not craft ${name}: ${error.message}`);
    }
  }

  getDimension() {
    return this.status.dimension;
  }
}

module.exports = { MemoryStore, BotManager, ITEM_ALIASES };
