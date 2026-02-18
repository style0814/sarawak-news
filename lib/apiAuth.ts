import { checkAdminSession } from './adminAuth';

export async function isCronOrAdminAuthorized(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return checkAdminSession();
}
