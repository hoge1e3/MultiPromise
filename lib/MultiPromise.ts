
export default class MultiPromise<R> {
    results: Array<R>=[];
    ended: boolean=false;
    resolveListeners: Array<(result:R)=>void>=[];
    endListeners: Array<()=>void>=[];
    static resolve<R>(...results: Array<R>):MultiPromise<R> {
        return new MultiPromise<R>((resolve, end)=>{
            for (const result of results) {
                resolve(result);
            }
            end();
        });
    }
    constructor(f?:(resolve:(result:R)=>void, end:()=>void)=>void) {
        if (f) f(this.doResolve.bind(this), this.doEnd.bind(this));
    }
    concat(or:MultiPromise<R>):MultiPromise<R> {
        return this.append(or);
    }
    append(or:MultiPromise<R>):MultiPromise<R> {
        const res=new MultiPromise<R>();
        let end1=false, end2=false;
        const checkEnd=()=>{
            if (end1 && end2) res.doEnd();
        };
        this.onResolve(r=>res.doResolve(r));
        or.onResolve(r=>res.doResolve(r));
        this.onEnd(()=>{
            end1=true;
            checkEnd();
        });
        or.onEnd(()=>{
            end2=true;
            checkEnd();
        });
        return res;
    }
    then<S>(next:(result:R)=>(MultiPromise<S>|void), outerEnd?:()=>void):MultiPromise<S> {
        const subPromises=new Set<MultiPromise<S>>();
        const resP=new MultiPromise<S>((resolve, innerEnd)=>{
            let ready=false;
            let ended=false;
            const attachEnd=(subPromise:MultiPromise<S>)=>{
                subPromise.onEnd(()=> {
                    subPromises.delete(subPromise);
                    checkEnd();
                });
            };
            const checkEnd=()=>{
                if (subPromises.size==0 && this.ended) {
                    if (ready) innerEnd();
                    ended=true;
                }
            };
            const proc=(result:R)=>{
                const subPromise=next(result);
                if (subPromise) {
                    subPromise.onResolve(resolve);
                    subPromises.add(subPromise);
                    attachEnd(subPromise);
                } else checkEnd();
            };
            this.onResolve(proc);
            this.onEnd(checkEnd);
            if (ended) innerEnd();
            ready=true;
        });
        if (outerEnd) this.onEnd(outerEnd);
        return resP;
    }
    map<S>(func:(r:R)=>S):MultiPromise<S> {
        const res=new MultiPromise<S>();
        this.onResolve(r=>res.doResolve(func(r)));
        this.onEnd(()=>res.doEnd());
        return res;
    }
    all<S>(func:(rs:Array<R>)=>MultiPromise<S>|undefined) {
        const rs=new Array<R>();
        const res=new MultiPromise<S>();
        this.onResolve(r=>rs.push(r));
        this.onEnd(()=>{
            const r=func(rs);
            if (r) r.connectTo(res);
            else res.doEnd();
        });
        return res;
    }
    connectTo(dest:MultiPromise<R>) {
        this.onResolve(r=>dest.doResolve(r));
        this.onEnd(()=>dest.doEnd());
    }
    onResolve(listener:(result:R)=>void) {
        for (const result of this.results) {
            listener(result);
        }
        this.resolveListeners.push(listener);
    }
    doResolve(result:R) {
        if (this.ended) throw new Error("Already ended");
        this.results.push(result);
        for (const listener of this.resolveListeners) {
            listener(result);
        }
    }
    onEnd(listener:()=>void) {
        if (this.ended) {
            listener();
            return;
        }
        this.endListeners.push(listener);
    }
    doEnd() {
        this.ended=true;
        for (const listener of this.endListeners) {
            listener();
        }
    }
}
