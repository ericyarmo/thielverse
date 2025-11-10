// thielverse-app/src/app/api/openapi/route.ts
export const dynamic = "force-dynamic";
export async function GET() {
  const spec = {
    openapi: "3.0.0",
    info: { title: "Frontier Index API", version: "0.1.0" },
    servers: [{ url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" }],
    paths: {
      "/api/receipts/latest": {
        get: {
          summary: "Latest receipts",
          parameters: [
            { name: "frontier", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 50 } },
            { name: "mode", in: "query", schema: { type: "string", enum: ["public","pro"], default: "public" } }
          ],
          responses: { "200": { description: "OK" } }
        }
      },
      "/api/entities/{slug}": {
        get: {
          summary: "Entity with recent receipts",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } }
        }
      },
      "/api/analysis/{cid}": {
        get: {
          summary: "Return analysis artifact (JSON) for a receipt",
          parameters: [{ name: "cid", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } }
        }
      }
    }
  };
  return new Response(JSON.stringify(spec, null, 2), { headers: { "content-type": "application/json" } });
}
