'use strict'

const EventEmitter = require('events')

module.exports = class Queue extends EventEmitter {
  constructor() {
    super()
    this._locked = false
    this._paused = false
    this._queue = []
  }

  pause() {
    this._paused = true
    this.emit('paused')
  }

  resume() {
    if (!this._paused)
      return false;

    this._paused = false
    this.emit('resumed')

    if (!this._locked)
      this._process()
  }

  push(task) {
    this._queue.push(() => new Promise((resolve) => {
      this.emit('task')
      task(resolve)
    }))

    if (!this._locked && !this._paused) this._process()
    return this
  }

  _lock() {
    this._locked = true
    this.emit('locked')
  }

  _unlock() {
    this._locked = false
    this.emit('unlocked')
  }

  _process() {
    if (!this._queue.length)
      return this._unlock()
    else if (!this._locked)
      this._lock();

    const item = this._queue.shift()
    item()
      .then(() => {
        this._process.call(this)
      })
      .catch((err) => console.log(err))
  }
}
