import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersWithAdmin, setUserAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

// One-time setup: Make the first registered user an admin
// This only works if there are NO admins yet (safety check)
export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();

    // Require AUTH_SECRET as protection
    if (secret !== process.env.AUTH_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
    }

    const users = getAllUsersWithAdmin();

    // Check if any admin already exists
    const existingAdmin = users.find(u => u.is_admin === 1);
    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin already exists. Use the admin panel to manage users.' }, { status: 400 });
    }

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found. Please register first.' }, { status: 400 });
    }

    // Make the first user an admin
    const firstUser = users[users.length - 1]; // getAllUsersWithAdmin sorts DESC, so last = first registered
    setUserAdmin(firstUser.id, true);

    return NextResponse.json({
      success: true,
      message: `User "${firstUser.username}" (${firstUser.email}) is now admin.`
    });
  } catch {
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}
