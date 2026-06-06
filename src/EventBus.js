class EventBus {
  constructor() {
    this._listeners = {}
  }

  on(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = []
    this._listeners[event].push(handler)
  }

  off(event, handler) {
    if (!this._listeners[event]) return
    this._listeners[event] = this._listeners[event].filter(h => h !== handler)
  }

  emit(event, payload) {
    if (!this._listeners[event]) return
    for (const h of this._listeners[event]) h(payload)
  }
}

export const bus = new EventBus()
