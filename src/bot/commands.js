class AIManager {
  constructor() {
    this.state = {
      currentDecision: 'Idle',
      taskHistory: []
    };
  }

  parseInstruction(text) {
    const instruction = String(text || '').trim();
    if (!instruction) return null;

    const lower = instruction.toLowerCase();

    if (lower.includes('follow')) {
      return { type: 'follow', target: 'self' };
    }

    if (lower.includes('stay') || lower.includes('hold position')) {
      return { type: 'stay', target: 'current' };
    }

    if (lower.includes('stop') || lower.includes('cancel')) {
      return { type: 'stop' };
    }

    const miningMatch = lower.match(/mine\s+(?:the\s+)?([a-z_\s]+)/i);
    if (miningMatch) {
      const item = miningMatch[1].trim();
      const amountMatch = lower.match(/(\d+)/);
      return { type: 'mine', item, amount: amountMatch ? Number(amountMatch[1]) : 1 };
    }

    const collectMatch = lower.match(/collect\s+(?:the\s+)?([a-z_\s]+?)(?:\s+(\d+))?$/i);
    if (collectMatch) {
      return { type: 'collect', item: collectMatch[1].trim(), amount: Number(collectMatch[2] || 1) };
    }

    const gotoMatch = lower.match(/go\s+to\s+(\d+)\s+(\d+)\s+(\d+)/i);
    if (gotoMatch) {
      return { type: 'goto', x: Number(gotoMatch[1]), y: Number(gotoMatch[2]), z: Number(gotoMatch[3]) };
    }

    const craftMatch = lower.match(/craft\s+(?:the\s+)?([a-z_\s]+?)(?:\s+(\d+))?$/i);
    if (craftMatch) {
      return { type: 'craft', item: craftMatch[1].trim(), amount: Number(craftMatch[2] || 1) };
    }

    if (lower.includes('inventory') || lower.includes('report inventory')) {
      return { type: 'inventory' };
    }

    if (lower.includes('coords') || lower.includes('coordinates')) {
      return { type: 'coords' };
    }

    if (lower.includes('status')) {
      return { type: 'status' };
    }

    if (lower.includes('help')) {
      return { type: 'help' };
    }

    return { type: 'unknown', raw: instruction };
  }

  setDecision(message) {
    this.state.currentDecision = message;
  }
}

module.exports = { AIManager };
