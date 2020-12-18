"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ParserPromise {
    constructor(f) {
        this.results = [];
        this.listeners = [];
        f((result) => {
            this.results.push(result);
            for (const listener of this.listeners) {
                listener.onAddResult(result);
            }
        }, () => {
            for (const listener of this.listeners) {
                listener.onEnd();
            }
        });
    }
    then(onAddResult, onEnd) {
        this.listeners.push({ onAddResult, onEnd });
        for (const result of this.results) {
            onAddResult(result);
        }
    }
}
exports.default = ParserPromise;
