import path from "path";
import { URL } from "url";
import { createReadStream } from "fs";
const fastify = (await import("fastify")).default();
const __dirname = new URL(".", import.meta.url).pathname;
import fetch from "node-fetch"
import Hypixel from "hypixel-api-reborn"
const hypixel = new Hypixel.Client(process.env.KEY, {rateLimit: "AUTO", keyLimit: 120})

fastify.register((await import("fastify-static")).default, {
  root: path.join(__dirname, "public"),
});
fastify.register((await import("fastify-rate-limit")).default, {
  global: false
});

fastify.get('/', function (request, reply) {
   reply.type("text/html").send(createReadStream(`${__dirname}/public/index.html`))
})

fastify.get("/api/activity/:uuid", {
  schema: {
    params: {
      type: "object",
      required: ["uuid"],
      properties: {
        uuid: { type: "string", format: "uuid" }
      }
    }
  },
  config: {
     rateLimit: {
        max: 15,
        timeWindow: "1 minute",
     }
  },
  async handler(req, reply) {
    const { uuid } = req.params;
  /*  const stat = await fetch(`https://api.hypixel.net/player?key=${process.env.KEY}&uuid=${uuid}`)
    const stats = await stat.json();
    const resstatus = await fetch(`https://api.hypixel.net/status?key=${process.env.KEY}&uuid=${uuid}`)
    console.log(resstatus)
    const status = await resstatus.json(); */
    const player = await hypixel.getPlayer(uuid, {raw: true});
   // if(!status.success) return { error: false, message: "Something wrong happend!"}
   // if(!stats.success) return { error: false, message: "Something wrong happend!"}
    const status = await hypixel.getStatus(uuid)
    if(!player || !status) return { error: false, message: "Something wrong happend!"}
    //if(status?.online) return { error: false, stats: stats.player, playing: {gameType: status?.session?.gameType, mode: status?.session?.mode, map: status?.session?.map }, online: true}
    //return { error: false, stats: stats.player, online: false};
    return { error: false, stats: player.player, playing: status, online: status.online}
  }
});


fastify.listen(3000, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
});