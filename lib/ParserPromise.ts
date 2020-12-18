import State from "./State";



export default class ParserPromise<R> {
    results: Array<State<R>>=[];
    listeners: Array<{onAddResult:(result:State<R>)=>void/*ParserPromise<R,P>*/, onEnd:()=>void}>=[];
    constructor(f:(addResult:(result:State<R>)=>void, end:()=>void)=>void) {
        f((result:State<R>)=>{
            this.results.push(result);
            for (const listener of this.listeners) {
                listener.onAddResult(result);
            }
        }, ()=> {
            for (const listener of this.listeners) {
                listener.onEnd();
            }
        });
    }
    then(onAddResult:(result:State<R>)=>void, onEnd:()=>void):void {
        this.listeners.push({onAddResult, onEnd});
        for (const result of this.results) {
            onAddResult(result);
        }
    }
}
