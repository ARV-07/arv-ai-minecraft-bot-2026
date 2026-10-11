class CommandRouter {
  constructor(botManager, memory, ai) {
    this.botManager = botManager;
    this.memory = memory;
    this.ai = ai;
    this.commands = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    this.commands.set('help', this.help.bind(this));
    this.commands.set('status', this.status.bind(this));
    this.commands.set('connect', this.connect.bind(this));
    this.commands.set('disconnect', this.disconnect.bind(this));
    this.commands.set('reconnect', this.reconnect.bind(this));
    this.commands.set('coords', this.coords.bind(this));
    this.commands.set('inventory', this.inventory.bind(this));
    this.commands.set('health', this.health.bind(this));
    this.commands.set('food', this.food.bind(this));
    this.commands.set('follow', this.follow.bind(this));
    this.commands.set('goto', this.goto.bind(this));
    this.commands.set('mine', this.mine.bind(this));
    this.commands.set('collect', this.collect.bind(this));
    this.commands.set('craft', this.craft.bind(this));
    this.commands.set('stop', this.stop.bind(this));
    this.commands.set('tasks', this.tasks.bind(this));
    this.commands.set('logs', this.logs.bind(this));
    this.commands.set('memory', this.memoryInfo.bind(this));
    this.commands.set('say', this.say.bind(this));
  }

  async route(raw) {
    const text = String(raw || '').trim();
    if (!text) return { ok: false, error: 'Empty command' };

    const normalized = text.replace(/^!+/, '');
    const [name, ...args] = normalized.split(/\s+/);
    const command = this.commands.get(name.toLowerCase());

    if (!command) {
      const parsed = this.ai.parseInstruction(text);
      if (!parsed || parsed.type === 'unknown') {
        return { ok: false, error: `Unknown command: ${name || text}` };
      }
      return this.executeIntent(parsed);
    }

    return command(args);
  }

  async executeIntent(intent) {
    if (!intent) return { ok: false, error: 'No intent provided' };
    this.ai.setDecision(`Parsed intent: ${intent.type}`);

    switch (intent.type) {
      case 'follow':
        return this.follow([intent.target || 'self']);
      case 'stop':
        return this.stop([]);
      case 'goto':
        return this.goto([String(intent.x), String(intent.y), String(intent.z)]);
      case 'mine':
        return this.mine([intent.item, String(intent.amount || 1)]);
      case 'collect':
        return this.collect([intent.item, String(intent.amount || 1)]);
      case 'craft':
        return this.craft([intent.item, String(intent.amount || 1)]);
      case 'inventory':
        return this.inventory([]);
      case 'coords':
        return this.coords([]);
      case 'status':
        return this.status([]);
      case 'help':
        return this.help([]);
      default:
        return { ok: false, error: `Unsupported intent: ${intent.type}` };
    }
  }

  help() {
    return {
      ok: true,
      data: {
        commands: [
          '!help', '!status', '!connect <host> <port>', '!disconnect', '!reconnect',
          '!coords', '!inventory', '!health', '!food', '!follow', '!goto <x> <y> <z>',
          '!mine <block> [amount]', '!collect <item> [amount]', '!craft <item> [amount]',
          '!stop', '!tasks', '!logs', '!memory', '!say <message>'
        ]
      }
    };
  }

  async status() {
    const state = this.botManager.getState();
    return { ok: true, data: state.status };
  }

  async connect(args) {
    const [host, port] = args;
    if (!host) {
      return { ok: false, error: 'Usage: !connect <host> <port>' };
    }
    this.botManager.host = host;
    this.botManager.port = Number(port || this.botManager.port || 25565);
    try {
      const bot = await this.botManager.connect();
      return { ok: true, data: { connected: !!bot, host: this.botManager.host, port: this.botManager.port } };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async disconnect() {
    try {
      await this.botManager.disconnect();
      return { ok: true, data: { disconnected: true } };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async reconnect() {
    try {
      await this.botManager.connect();
      return { ok: true, data: { reconnecting: true } };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  coords() {
    const pos = this.botManager.status.position;
    if (!pos) return { ok: false, error: 'No position available yet' };
    return { ok: true, data: { x: pos.x, y: pos.y, z: pos.z } };
  }

  inventory() {
    if (!this.botManager.isConnected()) return { ok: false, error: 'Bot is not connected' };
    const items = this.botManager.getInventorySummary();
    return { ok: true, data: items };
  }

  health() {
    return { ok: true, data: { health: this.botManager.status.health, food: this.botManager.status.food } };
  }

  food() {
    return { ok: true, data: { food: this.botManager.status.food } };
  }

  async follow(args) {
    if (!this.botManager.isConnected()) return { ok: false, error: 'Bot is not connected' };
    const target = args[0] || 'self';
    try {
      await this.botManager.followPlayer(target);
      return { ok: true, data: { following: target } };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async goto(args) {
    if (!this.botManager.isConnected()) return { ok: false, error: 'Bot is not connected' };
    const [x, y, z] = args;
    if (!x || !y || !z) return { ok: false, error: 'Usage: !goto <x> <y> <z>' };
    try {
      await this.botManager.safeMoveTo(Number(x), Number(y), Number(z));
      return { ok: true, data: { destination: { x: Number(x), y: Number(y), z: Number(z) } } };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async mine(args) {
    if (!this.botManager.isConnected()) return { ok: false, error: 'Bot is not connected' };
    const [blockName, amountArg] = args;
    const amount = Number(amountArg || 1);
    if (!blockName) return { ok: false, error: 'Usage: !mine <block> [amount]' };
    try {
      const mined = await this.botManager.mineBlock(blockName, amount);
      return { ok: true, data: { mined, block: blockName, amount } };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async collect(args) {
    if (!this.botManager.isConnected()) return { ok: false, error: 'Bot is not connected' };
    const [itemName, amountArg] = args;
    const amount = Number(amountArg || 1);
    if (!itemName) return { ok: false, error: 'Usage: !collect <item> [amount]' };
    try {
      const collected = await this.botManager.collectItem(itemName, amount);
      return { ok: true, data: { collected, item: itemName, amount } };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async craft(args) {
    if (!this.botManager.isConnected()) return { ok: false, error: 'Bot is not connected' };
    const [itemName, amountArg] = args;
    const amount = Number(amountArg || 1);
    if (!itemName) return { ok: false, error: 'Usage: !craft <item> [amount]' };
    try {
      await this.botManager.craftItem(itemName, amount);
      return { ok: true, data: { crafted: amount, item: itemName } };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async stop() {
    try {
      await this.botManager.stopMovement();
      return { ok: true, data: { stopped: true } };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  tasks() {
    const tasks = this.memory.getTasks();
    return { ok: true, data: tasks };
  }

  logs() {
    return { ok: true, data: this.botManager.getLogs() };
  }

  memoryInfo() {
    const settings = this.memory.getTasks();
    return { ok: true, data: { memory: settings } };
  }

  say(args) {
    const text = args.join(' ');
    if (!text) return { ok: false, error: 'Usage: !say <message>' };
    try {
      this.botManager.sendMessage(text);
      return { ok: true, data: { sent: text } };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}

module.exports = { CommandRouter };
