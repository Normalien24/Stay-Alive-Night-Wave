import { bus } from '../EventBus.js'
import { EVENTS } from '../constants.js'
import { ZombieBasic }   from '../entities/zombies/ZombieBasic.js'
import { ZombieRunner }  from '../entities/zombies/ZombieRunner.js'
import { ZombieBrute }   from '../entities/zombies/ZombieBrute.js'
import { ZombieSpitter } from '../entities/zombies/ZombieSpitter.js'

export class WaveManager {
  constructor(scene, assets, pathfinding, player, spawnRing) {
    this._scene      = scene
    this._assets     = assets
    this._pathfinding = pathfinding
    this._player     = player
    this._spawnRing  = spawnRing

    this.currentDay  = 0
    this.zombiesAlive = 0
    this.active      = false
    this.zombies     = []  // live zombie list (shared with Game)

    this._queue      = []
    this._spawnTimer = 0

    bus.on(EVENTS.ZOMBIE_DIED, () => {
      this.zombiesAlive--
      if (this.zombiesAlive <= 0 && this.active && this._queue.length === 0) {
        this.active = false
        bus.emit(EVENTS.WAVE_COMPLETE, { day: this.currentDay })
      }
    })
  }

  startWave(day) {
    this.currentDay  = day
    this.active      = true
    this.zombiesAlive = 0
    this._queue      = this._buildQueue(day)
    this._spawnTimer = 0
    bus.emit(EVENTS.WAVE_START, { day })
  }

  update(delta) {
    if (!this.active || this._queue.length === 0) return
    this._spawnTimer -= delta
    if (this._spawnTimer <= 0) {
      const entry = this._queue.shift()
      this._spawnZombie(entry.type)
      this._spawnTimer = entry.interval
    }
  }

  _buildQueue(day) {
    const total  = 8 + day * 4
    const hpMult = 1 + (day - 1) * 0.15
    const dmMult = 1 + (day - 1) * 0.10
    const interval = Math.max(1.2, 4.0 - day * 0.2)

    const basicCount   = Math.round(total * Math.max(0.8 - day * 0.07, 0.2))
    const runnerCount  = Math.round(total * Math.min(day * 0.05, 0.25))
    const bruteCount   = day >= 4 ? Math.round(total * Math.min((day - 3) * 0.04, 0.20)) : 0
    const spitterCount = Math.max(0, total - basicCount - runnerCount - bruteCount)

    const list = []
    const push = (type, count) => {
      for (let i = 0; i < count; i++) list.push({ type, hpMult, dmMult, interval })
    }
    push('basic',   basicCount)
    push('runner',  runnerCount)
    push('brute',   bruteCount)
    push('spitter', spitterCount)

    // Shuffle for variety
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]]
    }

    this.zombiesAlive = list.length
    return list
  }

  _spawnZombie(type) {
    const ring = this._spawnRing
    const pos  = ring[Math.floor(Math.random() * ring.length)]
    const entry = this._queue.length > 0 ? null : null  // just for context

    const constructors = {
      basic:   ZombieBasic,
      runner:  ZombieRunner,
      brute:   ZombieBrute,
      spitter: ZombieSpitter,
    }
    const Cls = constructors[type] || ZombieBasic

    // Find current queue entry's multipliers — we passed them via type entry object, but since we
    // already dequeued, we re-derive here. This is fine since all queued entries share same day.
    const hpMult = 1 + (this.currentDay - 1) * 0.15
    const dmMult = 1 + (this.currentDay - 1) * 0.10

    const zombie = new Cls(this._scene, this._assets, this._pathfinding, this._player, hpMult, dmMult)
    zombie.position.set(pos.x, 0, pos.z)
    zombie.mesh.position.copy(zombie.position)
    this.zombies.push(zombie)
  }
}
