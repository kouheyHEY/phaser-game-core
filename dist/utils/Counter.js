export class Counter {
    count;
    constructor(initialCount = 0) {
        this.count = initialCount;
    }
    increment() {
        this.count++;
    }
    getCount() {
        return this.count;
    }
}
