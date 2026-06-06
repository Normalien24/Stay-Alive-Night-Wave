import { SHOP_PRICES, PLAYER_UPGRADES, TOWER_UPGRADES } from '../constants.js'

export class ShopPanel {
  constructor(economy, player) {
    this._economy = economy
    this._player  = player
    this._panel   = document.getElementById('shop-panel')
    this._selectedTower = null
    this._init()
  }

  _init() {
    if (!this._panel) return

    // Resource purchases
    const resourceSection = document.getElementById('shop-resources')
    if (resourceSection) {
      for (const [type, price] of Object.entries(SHOP_PRICES)) {
        const btn = document.createElement('button')
        btn.className = 'shop-btn'
        const label = type === 'health' ? 'Heal +30' : `+${price.amount} ${type}`
        btn.innerHTML = `${label}<br><span class="cost">💰 ${price.gold}g</span>`
        btn.addEventListener('click', () => {
          this._economy.buyResource(type)
          this._refresh()
        })
        resourceSection.appendChild(btn)
      }
    }

    // Player upgrades
    const upgradeSection = document.getElementById('shop-upgrades')
    if (upgradeSection) {
      PLAYER_UPGRADES.forEach((upg, i) => {
        const btn = document.createElement('button')
        btn.className = 'shop-btn upgrade-btn'
        btn.dataset.upgradeIdx = i
        btn.innerHTML = `${upg.label}<br><span class="cost">💰 ${upg.goldCost}g</span>`
        btn.addEventListener('click', () => {
          this._economy.upgradePlayer(i)
          this._refresh()
        })
        upgradeSection.appendChild(btn)
      })
    }

    // Close button
    const closeBtn = document.getElementById('shop-close')
    if (closeBtn) closeBtn.addEventListener('click', () => this._panel.style.display = 'none')
  }

  setSelectedTower(tower) {
    this._selectedTower = tower
    this._refreshTowerSection()
  }

  _refreshTowerSection() {
    const section = document.getElementById('shop-tower')
    if (!section) return
    section.innerHTML = ''
    if (!this._selectedTower) return

    const tower = this._selectedTower
    const nextLevel = tower.level + 1
    const upg = TOWER_UPGRADES.find(u => u.level === nextLevel)

    if (upg) {
      const btn = document.createElement('button')
      btn.className = 'shop-btn'
      btn.innerHTML = `Upgrade Tower (Lv${nextLevel})<br><span class="cost">💰 ${upg.goldCost}g</span>`
      btn.addEventListener('click', () => {
        this._economy.upgradeTower(tower)
        this._refreshTowerSection()
      })
      section.appendChild(btn)
    } else {
      section.innerHTML = '<p style="color:#aaa">Tower at max level</p>'
    }
  }

  _refresh() {
    // Update affordability visual
    if (!this._panel) return
    this._panel.querySelectorAll('.shop-btn').forEach(btn => {
      const costEl = btn.querySelector('.cost')
      if (!costEl) return
      const gold = parseInt(costEl.textContent) || 0
      btn.style.opacity = this._player.gold >= gold ? '1' : '0.5'
    })
  }
}
