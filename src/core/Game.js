import * as THREE from 'three'
import { bus } from '../EventBus.js'
import { EVENTS } from '../constants.js'
import { AssetLoader }      from './AssetLoader.js'
import { InputManager }     from './InputManager.js'
import { WorldMap }         from '../world/WorldMap.js'
import { DayNightCycle }    from '../world/DayNightCycle.js'
import { Grid }             from '../world/Grid.js'
import { Player }           from '../entities/Player.js'
import { PathfindingSystem } from '../systems/PathfindingSystem.js'
import { WaveManager }      from '../systems/WaveManager.js'
import { BuildingManager }  from '../systems/BuildingManager.js'
import { CombatSystem }     from '../systems/CombatSystem.js'
import { EconomySystem }    from '../systems/EconomySystem.js'
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera.js'
import { BuildCamera }      from '../camera/BuildCamera.js'
import { HUD }              from '../ui/HUD.js'
import { ShopPanel }        from '../ui/ShopPanel.js'
import { MobileControls }  from '../ui/MobileControls.js'
import { Bullet }           from '../projectiles/Bullet.js'

export class Game {
  constructor(canvas) {
    this._canvas  = canvas
    this._state   = 'loading'  // loading | menu | playing | gameover
    this._buildMode = false
    this._dayCounter = 1

    // THREE setup
    this._renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this._renderer.shadowMap.enabled = true
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this._resize()

    this._scene  = new THREE.Scene()
    this._camera = new THREE.PerspectiveCamera(65, canvas.width / canvas.height, 0.1, 500)
    this._clock  = new THREE.Clock()

    this._input  = new InputManager()
    this._assets = new AssetLoader()

    window.addEventListener('resize', () => this._resize())
  }

  async start() {
    await this._assets.load()
    this._initSystems()
    this._initFlowField()
    this._bindUI()
    this._state = 'playing'
    document.getElementById('main-menu')?.remove()
    this._clock.start()
    this._loop()
  }

  _initSystems() {
    this._grid       = new Grid()
    this._pathfinding = new PathfindingSystem(this._grid)

    this._world      = new WorldMap(this._scene, this._assets)
    this._dayNight   = new DayNightCycle(this._scene)
    this._scene.background = new THREE.Color(0x87ceeb)
    this._scene.fog = new THREE.Fog(0x87ceeb, 60, 200)

    this._player = new Player(this._scene, this._assets)

    this._waveManager = new WaveManager(
      this._scene, this._assets, this._pathfinding,
      this._player, this._world.getSpawnRing()
    )

    this._buildingMgr = new BuildingManager(
      this._scene, this._assets, this._grid, this._pathfinding, this._player
    )

    this._combat  = new CombatSystem()
    this._economy = new EconomySystem(this._player)

    this._tpCamera    = new ThirdPersonCamera(this._camera)
    this._buildCamera = new BuildCamera(this._camera)

    this._hud     = new HUD()
    this._shop    = new ShopPanel(this._economy, this._player)
    this._mobile  = new MobileControls(this._input)

    this._bullets     = []
    this._projectiles = []

    // Day start event → increment day counter and start wave at night
    bus.on(EVENTS.NIGHT_START, () => {
      if (!this._waveManager.active) {
        this._waveManager.startWave(this._dayCounter)
      }
    })

    bus.on(EVENTS.DAY_START, () => {
      // Remove any leftover zombies when a new day begins
      for (const z of this._waveManager.zombies) {
        if (z.alive) z.destroy()
      }
      this._waveManager.zombies.length = 0
      this._waveManager.active = false
    })

    bus.on(EVENTS.WAVE_COMPLETE, () => {
      this._dayCounter++
      this._initFlowField()
    })

    bus.on(EVENTS.PLAYER_DIED, () => {
      this._state = 'gameover'
      document.getElementById('game-over').style.display = 'flex'
      document.getElementById('go-day').textContent = `You survived ${this._dayCounter - 1} day(s)`
    })
  }

  _initFlowField() {
    // Initial flow field: zombies head toward map center (player base)
    const targets = [{ gx: 50, gz: 50 }]
    for (const b of this._buildingMgr.buildings) {
      for (const cell of b.gridCells) targets.push(cell)
    }
    this._pathfinding.computeFlowField(targets)
  }

  _bindUI() {
    // Build panel buttons — selecting a structure type activates the ghost
    document.querySelectorAll('[data-build]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this._dayNight.phase === 'night') return
        const type = btn.dataset.build
        // If not already in build mode, activate it
        if (!this._buildMode) {
          this._buildMode = true
          this._buildCamera.activate()
          this._hud.showBuildMode(true)
        }
        this._buildingMgr.enterBuildMode(type)
      })
    })

    document.getElementById('shop-close')?.addEventListener('click', () => {
      this._hud.showShop(false)
    })

    document.getElementById('build-exit')?.addEventListener('click', () => {
      this._buildMode = false
      this._buildingMgr.exitBuildMode()
      this._hud.showBuildMode(false)
    })

    // Build mode exit on B or Escape
    // Handled in update loop

    // Left click in build mode
    this._canvas.addEventListener('click', (e) => {
      if (!this._buildMode) return
      const worldPos = this._buildCamera.screenToWorld(
        e.clientX, e.clientY,
        this._renderer.domElement.clientWidth,
        this._renderer.domElement.clientHeight
      )
      if (!worldPos) return
      const { gx, gz } = this._grid.worldToCell(worldPos.x, worldPos.z)
      this._buildingMgr.tryPlace(gx, gz)
    })
  }

  _loop() {
    requestAnimationFrame(() => this._loop())
    const delta = Math.min(this._clock.getDelta(), 0.1)

    if (this._state !== 'playing') {
      this._input.flush()
      return
    }

    this._update(delta)
    this._renderer.render(this._scene, this._camera)
    this._input.flush()  // clear pressed/released AFTER all logic has read them
  }

  _update(delta) {
    this._input.update()

    // Toggle build mode with B key
    if (this._input.wasPressed('KeyB')) {
      this._input.consumePress('KeyB')
      if (this._dayNight.phase === 'night') {
        this._hud._showAlert('Cannot build at night!', 1.5)
      } else if (this._buildMode) {
        this._buildMode = false
        this._buildingMgr.exitBuildMode()
        this._hud.showBuildMode(false)
      } else {
        this._buildMode = true
        this._buildCamera.activate()
        this._hud.showBuildMode(true)
      }
    }

    if (this._buildMode && this._input.wasPressed('Escape')) {
      this._input.consumePress('Escape')
      this._buildMode = false
      this._buildingMgr.exitBuildMode()
      this._hud.showBuildMode(false)
    }

    // Shop toggle on F
    if (this._input.wasPressed('KeyF')) {
      this._input.consumePress('KeyF')
      const panel = document.getElementById('shop-panel')
      const showing = panel?.style.display === 'block'
      this._hud.showShop(!showing)
    }

    // Player ranged attack on left click (not in build mode)
    if (!this._buildMode && this._input.isMouseDown(0)) {
      if (this._player.equippedWeapon === 'ranged') {
        const dir = this._player.tryRangedAttack(this._camera)
        if (dir) {
          const origin = this._player.position.clone().add(new THREE.Vector3(0, 1.2, 0))
          const bullet = new Bullet(this._scene, this._assets, origin, dir, this._player.rangedDamage, 'player')
          this._bullets.push(bullet)
        }
      } else {
        if (this._player.tryMeleeAttack(this._waveManager.zombies)) {
          this._combat.checkMeleeHit(this._player.position, this._waveManager.zombies, this._player.meleeDamage)
        }
      }
    }

    // Day/night + world
    this._dayNight.update(delta)
    this._world.update(delta)

    // Player
    this._player.update(delta, this._input, this._world.resourceNodes, this._combat)

    // Wave + zombies
    this._waveManager.update(delta)
    const spitProjectiles = []
    for (let i = this._waveManager.zombies.length - 1; i >= 0; i--) {
      const z = this._waveManager.zombies[i]
      z.update(delta, spitProjectiles, this._scene, this._assets)
      if (!z.alive) this._waveManager.zombies.splice(i, 1)
    }
    this._projectiles.push(...spitProjectiles)

    // Collect tower bullets produced this frame
    this._bullets.push(...this._buildingMgr.getAllBullets())

    // Bullet / projectile updates
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      this._bullets[i].update(delta)
      if (!this._bullets[i].alive) this._bullets.splice(i, 1)
    }

    for (let i = this._projectiles.length - 1; i >= 0; i--) {
      this._projectiles[i].update(delta)
    }
    this._projectiles = this._projectiles.filter(p => p.alive)

    // Combat
    this._combat.checkBulletCollisions(this._bullets, this._waveManager.zombies, this._buildingMgr.buildings)
    this._combat.checkSpitCollisions(this._projectiles, this._player)
    this._combat.checkZombieAttacksBuildings(this._waveManager.zombies, this._buildingMgr.buildings)

    // Buildings update
    for (const b of this._buildingMgr.buildings) {
      if (b.update) {
        if (b.type === 'tower') b.update(delta, this._waveManager.zombies, this._scene)
        else if (b.type === 'trap') b.update(delta, this._waveManager.zombies)
        else b.update(delta)
      }
    }

    // Build mode
    if (this._buildMode) {
      this._buildCamera.update(delta, this._input)
      this._buildingMgr.update(
        delta, this._buildCamera, this._input,
        this._renderer.domElement.clientWidth,
        this._renderer.domElement.clientHeight
      )
    } else {
      this._tpCamera.update(delta, this._player.position, this._input)
    }

    // HUD
    this._hud.update(this._player, this._dayNight, this._waveManager, delta)
  }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight
    this._renderer.setSize(w, h)
    if (this._camera) {
      this._camera.aspect = w / h
      this._camera.updateProjectionMatrix()
    }
  }
}
