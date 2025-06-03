export class Counter {
    private count: number;

    constructor(initialCount: number = 0) {
        this.count = initialCount;
    }

    increment(): void {
        this.count++;
    }

    getCount(): number {
        return this.count;
    }
}