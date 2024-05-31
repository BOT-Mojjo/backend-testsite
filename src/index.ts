import { Elysia, error } from "elysia"
import { cors } from "@elysiajs/cors"
import { html } from "@elysiajs/html"
import mongoose from "mongoose"
const server = new Elysia()
.use(cors({methods:['GET','POST', 'DELETE']}))
.use(html()).onRequest(({request, set}) => {
    if (request.method !== "OPTIONS") return;
    let allowHeader = set.headers["Access-Control-Allow-Headers"];
    if (allowHeader === "*") {
        set.headers["Access-Control-Allow-Headers"] = request.headers.get("Access-Control-Request-Headers") ?? "";
    }
    allowHeader = set.headers["Access-Control-Allow-Origin"];
    if (allowHeader === "*") {
        set.headers["Access-Control-Allow-Origin"] = request.headers.get("origin") ?? "";
    }
    return set
})
.get("/forum/", ({headers, set}) => {
    set.status = 400
    console.log(headers.last_id, headers.page_amount)
    if (+headers.last_id! > 0) {
        set.status = 200
        return Post.find({_id: { $gt: headers.last_id }}).limit(+headers.page_amount! ?? 20).exec()
    } else {
        set.status = 200
        return Post.find().sort({ createdAt: -1 }).limit(+headers.page_amount! ?? 20).exec()
    }
})
.get("/post/:id", async ({set, params: {id}}) =>{
    console.log(id);
    set.status = 400
    let a = await Post.findById(id).exec()
    set.status = 200
    set.headers["content-type"] = "application/json"
    return a?.toJSON()
})
.post("/post/:id", async ({set, params: {id}}) =>{
    console.log(id);
    set.status = 400
    let a = await Post.findByIdAndUpdate(id, {$inc: { post_rating: 1} }).exec()
    set.status = 200
    set.headers["content-type"] = "application/json"
    return JSON.stringify(a?.post_rating!+1);
})
.post("/newpost/", (req) => {
    req.set.status = 400
    let new_post = new Post({
        //@ts-ignore
        title: req.body.title,
        //@ts-ignore
        challange: req.body.challange,
        //@ts-ignore
        body: req.body.body,
        //@ts-ignore
        post_rating: 0
    })
    new_post.save().then()
    req.set.status = 200
})
.delete("/post/:id", async ({set, params: {id}}) =>{
    console.log(id, "is gone")
    await Post.findByIdAndDelete(id)
})
.delete("/burn/", () => {
    console.log("burned");
    Post.collection.drop()
})


server.listen(process.env.PORT as string, () => console.log(`🦊 Server started at ${server.server?.url.origin}`));

const post_s = new mongoose.Schema({
    title: { type: String, required: true },
    challange: { type: Number, required: true },
    body: { type: String, Required: true},
    post_rating: { type: Number, required: true },
}, {timestamps: true})

const Post = mongoose.model("Post", post_s);

const con = mongoose.connect(process.env.CLUSTER_URI as string).then()