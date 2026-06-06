import { bus } from '../EventBus.js'
import { EVENTS, SHOP_PRICES, PLAYER_UPGRADES, TOWER_UPGRADES } from '../constants.js'

export class EconomySystem {
  constructor(player) {
    this._player = player

    bus.on(EVENTS.ZOMBIE_DIED, ({ zombie }) => {
      this._player.addGold(zombie.goldDrop)
    })
  }

  buyResource(type) {
    const price = SHOP_PRICES[type]
    if (!price) return false
    if (!this._player.spendGold(price.gold)) return false
    if (type === 'health') {
      this._player.heal(price.amount)
    } else {
      this._player.addResource(type, price.amount)
    }
    bus.emit(EVENTS.SHOP_PURCHASE, { itemId: type, cost: price.gold })
    return true
  }

  upgradePlayer(statIndex) {
    const upg = PLAYER_UPGRADES[statIndex]
    if (!upg) return false
    if (!this._player.spendGold(upg.goldCost)) return false
    this._player[upg.stat] += upg.bonus
    if (upg.stat === 'maxHealth') this._player.health = Math.min(this._player.health + upg.bonus, this._player.maxHealth)
    return true
  }

  upgradeTower(tower) {
    const nextLevel = tower.level + 1
    const upg = TOWER_UPGRADES.find(u => u.level === nextLevel)
    if (!upg) return false
    if (!this._player.spendGold(upg.goldCost)) return false
    tower.upgrade(upg)
    return true
  }
}
