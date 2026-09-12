import { currentUser, auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Synchronizes the currently authenticated Clerk user with the Supabase `profiles` table.
 * Automatically handles create or update (upsert) using Prisma ORM.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: No active Clerk session', synced: false },
        { status: 401 }
      );
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User details not found in Clerk', synced: false },
        { status: 404 }
      );
    }

    const email =
      user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      null;

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.username ||
      (email ? email.split('@')[0] : 'Analyst');

    // Upsert the profile in Supabase via Prisma
    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email,
        name,
      },
      create: {
        id: user.id,
        email,
        name,
      },
    });

    return NextResponse.json({
      success: true,
      synced: true,
      profile,
    });
  } catch (error) {
    console.error('[API /api/auth/sync] Error syncing user with Supabase:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error', synced: false },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
