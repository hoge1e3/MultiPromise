import State from "./lib/State";
import MultiPromise from "./lib/MultiPromise";

const R=MultiPromise.resolve;
// expr = E |  expr-E
interface Node {
    isRedundant():boolean;
}
const dict={"か":"蚊","が":"蛾","がか":"画家","かが":"加賀"};
class Noun implements Node{
    constructor (public c:string){}
    toString() {
        return dict[this.c];
    }
    isRedundant(){return false;}
}
class Or implements Node{
    constructor (public left: Node, public right:Node){}
    toString() {
        return `${this.left}か${this.right}`
    }
    flatten():Array<Node> {
        const f=(n:Node)=>n instanceof Or?n.flatten():[n];
        return f(this.left).concat(f(this.right));
    }
    isRedundant():boolean {
        if (this.left.isRedundant() || this.right.isRedundant()) return true;
        const m=new Set<string>();
        for (const n of this.flatten()) {
            if (m.has(`${n}`)) return true;
            m.add(`${n}`);
        }
        return false;
    }
}
class Ka implements Node {
    constructor (public body: Node){}
    toString() {
        return `${this.body}か`;
    }
    isRedundant(){return this.body.isRedundant();}
}
class Isa implements Node{
    constructor (public left: Node, public right:Node){}
    toString() {
        return `「${this.left}が${this.right}」`;
    }
    isInclusive() {
        const f=(n:Node)=>n instanceof Or?n.flatten():[n];
        const ls=new Set<string>();
        const rs=new Set<string>();
        for (const l of f(this.left)) ls.add(`${l}`);
        for (const r of f(this.right)) rs.add(`${r}`);
        for (const l of ls.values()) {
            if (rs.has(l)) return true;
        }
        for (const r of rs.values()) {
            if (ls.has(r)) return true;
        }
        return false;
    }
    isRedundant(){
        return `${this.left}`===`${this.right}` || this.isInclusive() || this.left.isRedundant() || this.right.isRedundant();
    }
}

class StateImpl implements State<Node> {
    constructor(public result: Node,
    public input: string,
    public pos: number){}
    get id(): string {
        return ""+this.pos;
    }
    get eof(): boolean {
        return this.pos>=this.input.length;
    }
    advance( by:number, result:Node=this.result){
        return new StateImpl(result, this.input, this.pos+by);
    }
    withResult(result:Node) {
        return new StateImpl(result, this.input, this.pos);
    }
    head(c:number=1) {
        return this.input.substring(this.pos, this.pos+c);
    }
    lookingAt(str: RegExp|string):string|undefined {
        if (typeof str==="string") {
            if (this.head(str.length)===str)return str;
        } else {
            const r=str.exec(this.input.substring(this.pos));
            if (r) return r[0];
        }
    }
    advanceIfLooking(str: RegExp|string):StateImpl|undefined {
        const s=this.lookingAt(str);
        if (s) {
            return this.advance(s.length);
        }
    }
}

function parseNoun(s:StateImpl) {
    return new MultiPromise<StateImpl>((succ:(r:StateImpl)=>void, e:()=>void)=>{
        for (const n of ["か","が","がか"/*,"かが"*/]) {
            const r=s.lookingAt(n);
            if (r) {
                succ(s.advance(r.length, new Noun(r)));
            }
        }
        e();
    });
}
function parseOrNoun(s:StateImpl) {
    return parseNoun(s).then(s=>{
        const a=R(s);
        const r=s.advanceIfLooking("か");
        if (!r) return a;
        return parseOrNoun(r).map((s2:StateImpl)=>
            s2.withResult(new Or(s.result, s2.result))
        ).append(a);
    });
}
function parseIsa(s:StateImpl) {
    return parseOrNoun(s).then((s:StateImpl)=>{
        const r=s.advanceIfLooking("が");
        if (!r) return;
        return parseOrNoun(r).map((s2:StateImpl)=>
            s2.withResult(new Isa(s.result, s2.result))
        );
    });
}
function parseIsaOr(s:StateImpl) {
    return parseIsa(s).then((s:StateImpl)=>{
        const r=s.advanceIfLooking("か");
        if (!r) return R(s);
        return parseIsaOr(r).map((s2:StateImpl)=>
            s2.withResult(new Or(s.result, s2.result))
        ).concat(R(s));
    });
}
function parseIsaOrKa(s:StateImpl) {
    return parseIsaOr(s).then((s:StateImpl)=>{
        const r=s.advanceIfLooking("か");
        if (!r) return R(s);
        return R(r.withResult(new Ka(s.result))).concat(R(s));
    });
}
function* genSeq() {
    yield "か";
    yield "が";
    for (const g of genSeq()) {
        yield `${g}か`;
        yield `${g}が`;
    }
}
let count=0;
const seq=genSeq();
function removeSub(s:string, list:string[]) {
    let res=s;
    for (const sub of list) {
        const i=s.indexOf(sub);
        if (i<0) continue;
        res=res.substring(0,i)+("＊".repeat(sub.length))+res.substring(i+sub.length);
        if (count==13) {
            console.log(s, "matches", sub, res);
        }
    }
    return res;
}
function allSame<T>(items:T[]) {
    if (items.length<=1) return true;
    items=items.slice();
    const k=items.shift();
    while (items.length>0) {
        if (k!==items.shift()) return false;
    }
    return true;
}
function alreadyAppeared(items: string[], appeared: string[]):boolean {
    const r=items.map(item=>removeSub(item,appeared));
    if (allSame(r)) return true;
    console.log(r.map(s=>`[${s}]`).join("\n"));
    return false;
}
function allKa(items:Node[]) {
    for (const n of items) {
        if (!(n instanceof Ka)) return false;
    }
    return true;
}
function commonSeq(items:Node[]) {
    if (allKa(items)) return true;
    const f=(n:Node)=>n instanceof Or?n.flatten():[n];
    let hasKa=false;
    const flattens=items.map(n=>{
        if (n instanceof Ka) {hasKa=true; return n.body;}
        return n;
    }).map(f);
    if (allSame(flattens.map(f=>`${f[0]}`))) return true;
    if (!hasKa && allSame(flattens.map(f=>`${f[f.length-1]}`))) return true;
    if (items.length>=3 && allSame(flattens.map(i=>i.length))) {
        for (let i=1;i<items.length-1;i++) {
            if (allSame(flattens.map(f=>`${f[i]}`))) return true;
        }
    }
    return false;
}
const appeared:string[]=[];
function gen() {
    if (count>100) return;
    const str=seq.next().value;
    const initResult=new Noun("");
    const initState=new StateImpl(initResult,str,0);
    parseIsaOrKa(initState).then((r:StateImpl)=>{
        if (r.eof) return R(r);
    }).all((rs:Array<StateImpl>)=>{
        rs=rs.filter(r=>!r.result.isRedundant());
        if (rs.length>=2) {
        //if (!alreadyAppeared(rs.map(r=>`${r.result}`), appeared)) {
        //if (!commonSeq(rs.map(r=>r.result))) {
            count++;
            console.log(`[${count}]`, str);
            for (const r of rs) {
                console.log(`${r.result}`);
                appeared.unshift(`${r.result}`);
            }
            console.log("");
        }
        setTimeout(gen,0);
    });
}
gen();
//const t=new Isa(new Noun("が"),new Noun("が"));
//console.log(t,`${t}`,t.isRedundant());
