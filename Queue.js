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
      this.process()
  }

  lock() {
    this._locked = true
    this.emit('locked')
  }

  unlock() {
    this._locked = false
    this.emit('unlocked')
  }

  process() {
    if (!this._queue.length)
      return this.unlock()
    else if (!this._locked)
      this.lock();

    const item = this._queue.shift()
    item()
      .then(() => {
        this.process.call(this)
      })
      .catch((err) => console.log(err))
  }

  push(task) {
    this._queue.push(() => new Promise((resolve) => {
      this.emit('task')
      task(resolve)
    }))

    if (!this._locked && !this._paused) this.process()
    return this
  }
}
