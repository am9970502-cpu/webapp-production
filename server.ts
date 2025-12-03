import { Hono } from "https://deno.land/x/hono/mod.ts";

const app = new Hono();

app.get("/", (c) => c.text("Hello from Hono + Deno!"));

Deno.serve(app.fetch);
