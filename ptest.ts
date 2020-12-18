import State from "./lib/State";
import MultiPromise from "./lib/MultiPromise";


// expr = E |  expr-E
interface Node {

}
class Element implements Node{
    constructor (public c:string){}
}
class Minus implements Node{
    constructor (public left: Node, public right:Node){}
}
class StateImpl implements State<Node> {
    constructor(public result: Node,
    public input: string,
    public pos: number){}
    get id(): string {
        return ""+this.pos;
    }
    advance( by:number, result:Node=this.result){
        return new StateImpl(result, this.input, this.pos+by);
    }
    head(c:number=1) {
        return this.input.substring(this.pos, this.pos+c);
    }
}

function parseElem(s:StateImpl):MultiPromise<StateImpl> {
    const c=s.head();
    if (c.match(/\d/)) return MultiPromise.resolve(s.advance(1,new Element(c)));
    return MultiPromise.resolve();
}
function parseExpr(s:StateImpl):MultiPromise<StateImpl> {
    const res=new MultiPromise<StateImpl>((succ:(r:StateImpl)=>void, e:()=>void)=>{
        setTimeout(()=>{
            const p=parseElem(s);
            p.onResolve(succ);
            res.then((r:StateImpl)=>{
                if (r.head()==="-") {
                    const n=r.advance(1);
                    if (n.head().match(/\d/)) {
                        succ(n.advance(1,new Minus(r.result, new Element(n.head()))));
                    }
                }
                return MultiPromise.resolve();
            }, e);
        },0);
    });
    return res;
}
const initResult=new Element("");
const initState=new StateImpl(initResult,"9-8-7",0);
parseExpr(initState).then(s=>{
    console.log(s);
    return MultiPromise.resolve();
});
