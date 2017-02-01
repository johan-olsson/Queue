'use strict'

const EventEmitter = require('events')

module.exports = class Queue extends EventEmitter {
  constructor() {
    super()
    this._locked = false
    this._paused = false
    this._data = null
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
      this._process(this._data)
  }

  push(task) {
    this._queue.push(() => new Promise((resolve) => {
      this.emit('task')
      task((data) => {
        resolve(data)
      }, this._data)
    }))

    if (!this._locked && !this._paused) this._process(this._data)
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

  _process(data) {
    if (!this._queue.length)
      return this._unlock()
    else if (!this._locked)
      this._lock();

    const item = this._queue.shift()
    item(data)
      .then((data) => {
        this._data = data
        this._process.call(this, data)
      })
      .catch((err) => console.log(err))
  }
}
