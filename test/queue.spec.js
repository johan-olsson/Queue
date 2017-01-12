'use strict'

const assert = require('assert')
const Queue = require('../')

describe('Queue', function() {

  it('should be unlocked when all tasks are processed', (done) => {
    const queue = new Queue()

    queue.push((next) => {
      next()
      assert.equal(queue._locked, true)
      setTimeout(() => {
        assert.equal(queue._locked, false)
        done()
      })
    })
  })

  it('should be processed in order', (done) => {
    const queue = new Queue()
    var order = []

    queue.push((next) => {
      order.push(0)
      next()
    })
    queue.push((next) => {
      order.push(1)
      next()
    })
    queue.push((next) => {
      order.push(2)

      assert.equal(order.join(', '), '0, 1, 2')
      next()
      done()
    })
  })

  it('should emit events', (done) => {
    const queue = new Queue()
    var events = []

    queue.on('task', () => events.push('task'))
    queue.on('unlocked', () => events.push('unlocked'))
    queue.on('locked', () => events.push('locked'))

    queue.push((next) => next())
    queue.push((next) => next())

    setTimeout(() => {
      assert.equal(events.join(', '), 'locked, task, task, unlocked')
      done()
    })
  })

  it('should pause and resume', (done) => {
    const queue = new Queue()
    var value

    queue.push((next) => {
      value = 1
      next()
    })
    queue.pause()
    assert.equal(value, 1)
    queue.push((next) => {
      value = 2
      next()
    })
    queue.resume()
    setTimeout(() => {
      assert.equal(value, 2)
      done()
    })
  })
})
