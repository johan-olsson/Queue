# Queue [![Build Status](https://travis-ci.org/johan-olsson/Queue.svg?branch=master)](https://travis-ci.org/johan-olsson/Queue)

# Getting Started

```javascript
const Queue = require('ssfq')
const myQueue = new Queue(workerCount)

myQueue.push((next) => {
  /* do something */
  next()
})


```

```javascript

class YourClass extends Queue {

  find(query) {
    this.push((next) => {
      this._somedb.find(query, (docs) => {
        this.result = docs
      })
    })

    return this
  }

  each(fn) {
    this.push((next) => {
      this.result.forEach(fn)
    })

    return this
  }
}


var db = YourClass()
db.find({
    foo: 'bar'
  })
  .each((doc) => {
    console.log(doc)
  })
```
# Methods

## push(task, [options])

push task to queue
```javascript

queue.push((next) => {
  /* do something */
  next()
}, {
  priority: 2
})
```

### options

* priority _number, highest priority get executed first._ **default:** `0`

## resume()
unpause queue and continue processing tasks
```javascript

queue.resume()
```

## pause()
pause queue (after processing current task)
```javascript

queue.pause()
```

# Events
* `task` a new task is beeing processed
* `locked` queue is busy processing tasks
* `unlocked` queue is idle
* `paused` queue was paused and won't process any task until resumed
* `resumed` queue will continue processing tasks
