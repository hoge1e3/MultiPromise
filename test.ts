import MultiPromise from "./lib/MultiPromise";

const m=MultiPromise.resolve(2,3,10);
m.then((r:number)=>
    MultiPromise.resolve(...[4,5].map(e=>r*e))
).then((r:number)=>{
    console.log("R",r);
    if (r<100) {
        return m.then((r:number)=>MultiPromise.resolve(100*r));
    } else {
        return MultiPromise.resolve();
    }
}, ()=>{
    console.log("END2");
});

/*
async function test() {
    const r=await MultiPromise.resolve(2,3,10);
    console.log("Q",r);
}

test();
*/
