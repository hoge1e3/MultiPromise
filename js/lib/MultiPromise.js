define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MultiPromise {
        constructor(f) {
            this.results = [];
            this.ended = false;
            this.resolveListeners = [];
            this.endListeners = [];
            if (f)
                f(this.doResolve.bind(this), this.doEnd.bind(this));
        }
        static resolve(...results) {
            return new MultiPromise((resolve, end) => {
                for (const result of results) {
                    resolve(result);
                }
                end();
            });
        }
        concat(or) {
            return this.append(or);
        }
        append(or) {
            const res = new MultiPromise();
            let end1 = false, end2 = false;
            const checkEnd = () => {
                if (end1 && end2)
                    res.doEnd();
            };
            this.onResolve(r => res.doResolve(r));
            or.onResolve(r => res.doResolve(r));
            this.onEnd(() => {
                end1 = true;
                checkEnd();
            });
            or.onEnd(() => {
                end2 = true;
                checkEnd();
            });
            return res;
        }
        then(next, outerEnd) {
            const subPromises = new Set();
            const resP = new MultiPromise((resolve, innerEnd) => {
                let ready = false;
                let ended = false;
                const attachEnd = (subPromise) => {
                    subPromise.onEnd(() => {
                        subPromises.delete(subPromise);
                        checkEnd();
                    });
                };
                const checkEnd = () => {
                    if (subPromises.size == 0 && this.ended) {
                        if (ready)
                            innerEnd();
                        ended = true;
                    }
                };
                const proc = (result) => {
                    const subPromise = next(result);
                    if (subPromise) {
                        subPromise.onResolve(resolve);
                        subPromises.add(subPromise);
                        attachEnd(subPromise);
                    }
                    else
                        checkEnd();
                };
                this.onResolve(proc);
                this.onEnd(checkEnd);
                if (ended)
                    innerEnd();
                ready = true;
            });
            if (outerEnd)
                this.onEnd(outerEnd);
            return resP;
        }
        map(func) {
            const res = new MultiPromise();
            this.onResolve(r => res.doResolve(func(r)));
            this.onEnd(() => res.doEnd());
            return res;
        }
        all(func) {
            const rs = new Array();
            const res = new MultiPromise();
            this.onResolve(r => rs.push(r));
            this.onEnd(() => {
                const r = func(rs);
                if (r)
                    r.connectTo(res);
                else
                    res.doEnd();
            });
            return res;
        }
        connectTo(dest) {
            this.onResolve(r => dest.doResolve(r));
            this.onEnd(() => dest.doEnd());
        }
        onResolve(listener) {
            for (const result of this.results) {
                listener(result);
            }
            this.resolveListeners.push(listener);
        }
        doResolve(result) {
            if (this.ended)
                throw new Error("Already ended");
            this.results.push(result);
            for (const listener of this.resolveListeners) {
                listener(result);
            }
        }
        onEnd(listener) {
            if (this.ended) {
                listener();
                return;
            }
            this.endListeners.push(listener);
        }
        doEnd() {
            this.ended = true;
            for (const listener of this.endListeners) {
                listener();
            }
        }
    }
    exports.default = MultiPromise;
});
