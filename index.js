'use strict'

const EventEmitter = require('events')
const Task = require('./Task')

module.exports = class Queue extends EventEmitter {
  constructor(options) {
    super()

    options = Object.assign({
      workers: 1
    }, options)

    this._workers = options.workers
    this._locked = 0
    this._paused = false
    this._state = null
    this._queue = []
  }

  setWorkerCount(numberOfWorkers) {
    this._workers = numberOfWorkers
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
      this._process(this._state)
  }

  push(task, options = {}) {
    this._queue.push(new Task(task, options, this))

    if (this._locked < this._workers && !this._paused)
      this._process(this._state);

    return this
  }

  _createTask(task) {
    return () => new Promise((resolve) => {
      this.emit('task', task)
      task((state) => {
        resolve(state)
        this.emit('done', task)
      }, this._state)
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

  _process(state) {

    if (!this._queue.length) {
      if (!this._locked) return this.emit('idle');

      return;
    }

    this._lock();

    const item = this._queue.sort((a, b) => {
      if (a._priority > b._priority)
        return -1;
      else if (a._priority < b._priority)
        return 1;

      return 0
    }).shift()

    item.process(state)
      .then(state => {
        this._state = state
        this._unlock()
        this._process.call(this, state)
      })
      .catch(err => {
        console.error(err)
        this._unlock()
      })
  }
}
