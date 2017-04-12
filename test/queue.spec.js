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

  it('should use multiple workers', (done) => {
    const queue = new Queue(3)

    let callCount = 0

    const slowTask = (next) => {
      setTimeout(() => {
        callCount += 1
        next()
      }, 20)
    }

    queue.push(slowTask)
    queue.push(slowTask)
    queue.push(slowTask)

    setTimeout(() => {
      assert.equal(callCount, 3)
      done()
    }, 20)
  })

  it('should emit events', (done) => {
    const queue = new Queue(2)
    var events = []

    queue.on('task', () => events.push('task'))
    queue.on('done', () => events.push('done'))
    queue.on('unlocked', () => events.push('unlocked'))
    queue.on('locked', () => events.push('locked'))
    queue.on('idle', () => events.push('idle'))

    queue.push((next) => next())
    queue.push((next) => next())
    queue.push((next) => next())
    queue.push((next) => next())

    setTimeout(() => {
      assert.equal(events.join(', '), 'task, done, locked, task, done, unlocked, locked, task, done, unlocked, locked, task, done, unlocked, idle')
      done()
    })
  })

  it('should run unshifted tasks first', (done) => {
    const queue = new Queue()
    var result = []

    queue.push((next) => setTimeout(() => {
      result.push('1')
      next()
    }, 5))

    queue.push((next) => setTimeout(() => {
      result.push('3')
      next()
    }, 5))

    queue.unshift((next) => setTimeout(() => {
      result.push('2')
      next()
    }, 5))

    setTimeout(() => {
      assert.equal(result.join(', '), '1, 2, 3')
      done()
    }, 20)
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
    queue.resume()
    setTimeout(() => {
      assert.equal(value, 2)
      done()
    })
  })

  it('should pass data to next task', (done) => {
    const queue = new Queue()
    var value

    queue.push((next, data = 0) => {
      next(data + 1)
    })
    queue.pause()
    queue.push((next, data) => {
      next(data + 1)
    })
    queue.resume()
    queue.push((next, data) => {
      next(data + 1)
    })
    queue.push((next, data) => {
      assert.equal(data, 3)
      done()
    })
  })
})
