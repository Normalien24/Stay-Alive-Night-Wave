export const WORLD_SIZE = 200
export const CELL_SIZE = 2
export const GRID_CELLS = WORLD_SIZE / CELL_SIZE  // 100

export const DAY_DURATION = 120     // seconds
export const NIGHT_DURATION = 90    // seconds
export const NIGHT_WARNING_AT = 30  // seconds before night

export const HARVEST_RANGE = 3.5
export const MELEE_RANGE = 2.2
export const MELEE_DAMAGE = 40
export const RANGED_DAMAGE = 30
export const ATTACK_COOLDOWN = 0.5
export const PLAYER_SPEED = 8
export const PLAYER_MAX_HEALTH = 100
export const BULLET_SPEED = 30
export const BULLET_LIFETIME = 2.5

export const ZOMBIE_STATS = {
  basic:   { hp: 100, speed: 4,   damage: 10, range: 1.8, goldDrop: 5,  attackInterval: 1.0, color: 0x55aa44 },
  runner:  { hp:  40, speed: 9,   damage: 6,  range: 1.8, goldDrop: 8,  attackInterval: 0.6, color: 0xaadd22 },
  brute:   { hp: 500, speed: 1.8, damage: 35, range: 2.2, goldDrop: 25, attackInterval: 2.0, color: 0x885511 },
  spitter: { hp:  70, speed: 3,   damage: 15, range: 12,  goldDrop: 12, attackInterval: 2.5, color: 0x22aaaa },
}

export const WEAKNESSES = {
  basic:   { fire: 1.0, explosive: 1.0, melee: 1.0, aoe: 1.0,  ranged: 1.0 },
  runner:  { fire: 1.0, explosive: 1.0, melee: 1.0, aoe: 1.8,  ranged: 1.0 },
  brute:   { fire: 2.5, explosive: 2.5, melee: 1.0, aoe: 1.0,  ranged: 1.0 },
  spitter: { fire: 1.0, explosive: 1.0, melee: 2.0, aoe: 1.0,  ranged: 1.0 },
}

export const BUILDINGS = {
  wall:  { cost: { wood: 5, stone: 3, metal: 0 }, hp: 200 },
  tower: { cost: { wood: 3, stone: 5, metal: 4 }, hp: 120, range: 15, fireRate: 1.2, damage: 25 },
  trap:  { cost: { wood: 4, stone: 0, metal: 3 }, hp: 80,  aoeRadius: 3, damage: 60, charges: 3 },
}

export const TOWER_UPGRADES = [
  { level: 2, goldCost: 50,  rangeBonus: 3, damageBonus: 15, fireRateBonus: 0.3 },
  { level: 3, goldCost: 120, rangeBonus: 5, damageBonus: 30, fireRateBonus: 0.5 },
]

export const RESOURCE_NODES = {
  tree:  { yieldType: 'wood',  yieldAmount: 15, hp: 3, respawn: 60,  color: 0x228822 },
  rock:  { yieldType: 'stone', yieldAmount: 10, hp: 5, respawn: 90,  color: 0x888888 },
  scrap: { yieldType: 'metal', yieldAmount: 8,  hp: 2, respawn: 120, color: 0xaa7722 },
}

export const SHOP_PRICES = {
  wood:  { gold: 10, amount: 10 },
  stone: { gold: 12, amount: 8  },
  metal: { gold: 15, amount: 6  },
  health:{ gold: 20, amount: 30 },
}

export const PLAYER_UPGRADES = [
  { stat: 'speed',     label: 'Movement Speed', goldCost: 40,  bonus: 1.5 },
  { stat: 'damage',    label: 'Attack Damage',  goldCost: 50,  bonus: 15  },
  { stat: 'maxHealth', label: 'Max Health',      goldCost: 60,  bonus: 25  },
]

export const EVENTS = {
  ZOMBIE_DIED:         'ZOMBIE_DIED',
  PLAYER_HIT:          'PLAYER_HIT',
  RESOURCE_HARVESTED:  'RESOURCE_HARVESTED',
  BUILDING_PLACED:     'BUILDING_PLACED',
  BUILDING_DESTROYED:  'BUILDING_DESTROYED',
  WAVE_START:          'WAVE_START',
  WAVE_COMPLETE:       'WAVE_COMPLETE',
  DAY_START:           'DAY_START',
  NIGHT_START:         'NIGHT_START',
  GOLD_CHANGED:        'GOLD_CHANGED',
  PLAYER_DIED:         'PLAYER_DIED',
  SHOP_PURCHASE:       'SHOP_PURCHASE',
}
