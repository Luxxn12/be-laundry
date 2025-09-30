import type { NowRequest, NowResponse } from '@vercel/node';
import serverless from 'serverless-http';

import app from '../src/app';
import { connectPrisma } from '../src/db/prisma';

const handler = serverless(app);

let prismaConnected = false;

export default async function vercelHandler(req: NowRequest, res: NowResponse) {
  if (!prismaConnected) {
    await connectPrisma();
    prismaConnected = true;
  }

  return handler(req as never, res as never);
}
