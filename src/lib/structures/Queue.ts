export type PromiseFunction = () => Promise<void>

export class Queue {
	_queue: PromiseFunction[] = [];
	_processing: boolean = false;

	get length() {
		return this._queue.length;
	}

	add(promiseFunc: PromiseFunction) {
		this._queue.push(promiseFunc);
		if (!this._processing) this._process();
	}

	_process() {
		this._processing = true;
		const promiseFunc = this._queue.shift();

		if (!promiseFunc) {
			this._processing = false;
		} else {
			promiseFunc().then(() => this._process).catch((err: any) => { throw err });
		}
	}
}