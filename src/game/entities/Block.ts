import type { Block } from '../../types/game.types';

export function createBlock(color: string, health = 1): Block {
  return {
    exists: true,
    color,
    health,
    maxHealth: health,
    isPartOfLine: false,
    isWarning: false,
  };
}

export function damageBlock(block: Block, damage: number): Block | null {
  const newHealth = block.health - damage;

  if (newHealth <= 0) {
    return null;
  }

  return {
    ...block,
    health: newHealth,
  };
}

export function getBlockDamageColor(block: Block): string {
  if (block.maxHealth === 1) {
    return block.color;
  }

  // Darken color based on damage taken
  const healthRatio = block.health / block.maxHealth;

  // Parse hex color
  let r = parseInt(block.color.slice(1, 3), 16);
  let g = parseInt(block.color.slice(3, 5), 16);
  let b = parseInt(block.color.slice(5, 7), 16);

  // Darken based on damage
  const darkenFactor = 0.3 + healthRatio * 0.7;
  r = Math.floor(r * darkenFactor);
  g = Math.floor(g * darkenFactor);
  b = Math.floor(b * darkenFactor);

  return `rgb(${r}, ${g}, ${b})`;
}

export function isBlockReinforced(block: Block): boolean {
  return block.maxHealth > 1;
}
