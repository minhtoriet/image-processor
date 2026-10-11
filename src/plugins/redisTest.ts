import 'dotenv/config'
import { createClient } from 'redis';

const url = process.env.REDIS_URL!;
const client = createClient({ url: url });

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

//await client.set('foo', 'bar');
const result = await client.get('foo');
console.log(result)  // >>> bar

