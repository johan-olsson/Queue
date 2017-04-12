'use strict'

const EventEmitter = require('events')

module.exports = class Queue extends EventEmitter {
  constructor(workers) {
    super()

    this._workers = workers || 1
    this._locked = 0
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

    if (this._locked < this._workers)
      this._process(this._data)
  }

  push(task) {
    this._queue.push(this._createTask(task))

    if (this._locked < this._workers && !this._paused)
      this._process(this._data);

    return this
  }

  unshift(task) {
    this._queue.unshift(this._createTask(task))

    if (this._locked < this._workers && !this._paused)
      this._process(this._data);

    return this
  }

  _createTask(task) {
    return () => new Promise((resolve) => {
      this.emit('task')
      task((data) => {
        resolve(data)
        this.emit('done')
      }, this._data)
    })
  }

  _lock() {
    this._locked += 1

    if (this._locked === this._workers)
      this.emit('locked');
  }

  _unlock() {
    this._locked -= 1

    if (this._locked === this._workers - 1)
      this.emit('unlocked');
  }

  _process(data) {

    if (!this._queue.length) {
      if (!this._locked) return this.emit('idle');

      return;
    }

    this._lock();

    const item = this._queue.shift()
    item(data)
      .then(data => {
        this._data = data
        this._unlock()
        this._process.call(this, data)
      })
      .catch(err => {
        this._unlock()
        console.log(err)
      })
  }
}
