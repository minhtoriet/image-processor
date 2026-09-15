// Equivalent to Entity Framework DbContext setup
import 'dotenv/config'
import { PrismaClient } from "../generated/prisma";
import { PrismaNeon } from '@prisma/adapter-neon'

const prismaClientSingleton = () => {
  const connectionString =  process.env.DATABASE_URL
  const adapter = new PrismaNeon({connectionString});

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    adapter,
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}