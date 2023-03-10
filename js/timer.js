export class Timer {
    constructor(callback, delay) {
        this.callback = callback
        this.remainingTime = delay
        this.startTime
        this.timerId
    }

    pause() {
        clearTimeout(this.timerId)
        this.remainingTime -= new Date() - this.startTime
    }

    resume() {
        this.startTime = new Date()
        clearTimeout(this.timerId)
        this.timerId = setTimeout(this.callback, this.remainingTime)
    }

    start() {
        this.timerId = setTimeout(this.callback, this.remainingTime)
    }
    setCallback(callback) {
        this.callback = callback
    }
    setDelay(delay) {
        this.remainingTime = delay
    }
    stop() {
        clearTimeout(this.timerId)
    }
    getRemainingTime() {
        return this.remainingTime
    }

}