'use strict'

const EventEmitter = require('events')

module.exports = class Task extends EventEmitter {
  constructor(task, options, queue) {
    super()

    this._priority = options.priority || 0
    this._createdAt = Date.now()

    this.process = (state) => new Promise((resolve) => {
      queue.emit('task', this)
      this.emit('task', this)
      task((state) => {
        resolve(state)
        queue.emit('done', this)
        this.emit('done', this)
      }, queue._state)
    })
  }

  setPriority(priority) {
    this._priority = priority
  }
}
