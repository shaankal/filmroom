import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    /** Supabase Auth JWT `sub` — set by auth plugin when Authorization bearer present */
    userId?: string;
  }
}
