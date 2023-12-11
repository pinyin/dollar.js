export class LinkedList<T> {
    private head: LinkedListNode<T> | null = null;
    private tail: LinkedListNode<T> | null = null;

    public get first(): LinkedListNode<T> | null {
        return this.head ?? null;
    }

    public get last(): LinkedListNode<T> | null {
        return this.tail ?? null;
    }

    public get isEmpty() {
        return this.head == null;
    }

    public add(data: T): LinkedListNode<T> {
        const node = new LinkedListNode(data, this);
        if (this.tail == null && this.head === null) {
            this.tail = node;
            this.head = node;
        } else {
            node.prev = this.tail;
            this.tail.next = node;
            this.tail = node;
        }
        return node;
    }

    public addFirst(data: T): LinkedListNode<T> {
        const node = new LinkedListNode(data, this);
        if (this.tail == null && this.head === null) {
            this.tail = node;
            this.head = node;
        } else {
            node.next = this.head;
            this.head.prev = node;
            this.head = node;
        }
        return node;
    }

    public* [Symbol.iterator](): LinkedListNode<T> {
        let current = this.head;
        while (current !== null) {
            yield current;
            current = current.next;
        }
    }
}

export class LinkedListNode<T> {
    public next: LinkedListNode<T> | null = null;
    public prev: LinkedListNode<T> | null = null;

    constructor(public value: T, public readonly linkedList: LinkedList<T>) {
    }

    get isDetached() {
        return this.next === this.prev === null;
    }

    detach(): void {
        this.next.prev = this.prev;
        this.prev.next = this.next;
        this.next = null;
        this.prev = null;
    }

    insertNext(value: T): LinkedListNode<T> {
        const result = new LinkedListNode<T>(value, this.linkedList);
        result.next = this.next;
        result.prev = this;
        this.next.prev = result;
        this.next = result;
        return result;
    }

    insertPrev(value: T): LinkedListNode<T> {
        const result = new LinkedListNode<T>(value, this.linkedList);
        result.next = this;
        result.prev = this.prev;
        this.prev.next = result;
        this.prev = result;
        return result;
    }
}