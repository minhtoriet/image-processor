import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma';

export const prismaPlugin = fp(async (fastify, options) => {
  fastify.decorate('prisma', prisma);
  fastify.addHook('onClose', async (server) => {
    await server.prisma.$disconnect();
  });
});