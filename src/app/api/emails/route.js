import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { autoPersistEmailToSupabase } from '@/lib/emailPersistence';

export const dynamic = 'force-dynamic';

// Resolve user profile
async function resolveUserProfile() {
  try {
    const { userId } = await auth();

    if (userId) {
      const clerkUser = await currentUser();
      const email =
        clerkUser?.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
        clerkUser?.emailAddresses?.[0]?.emailAddress ||
        null;

      const name =
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ').trim() ||
        clerkUser?.username ||
        (email ? email.split('@')[0] : 'Analyst');

      const profile = await prisma.profile.upsert({
        where: { id: userId },
        update: { email, name },
        create: { id: userId, email, name }
      });

      return profile;
    }
  } catch (err) {
    console.warn('[API /api/emails] Clerk auth check notice:', err.message);
  }

  // Fallback analyst profile
  const primaryProfile =
    (await prisma.profile.findFirst({
      where: { email: 'krishsanghani013@gmail.com' }
    })) || (await prisma.profile.findFirst());

  if (primaryProfile) {
    return primaryProfile;
  }

  return await prisma.profile.upsert({
    where: { id: 'analyst_guest' },
    update: {},
    create: {
      id: 'analyst_guest',
      name: 'SOC Analyst (Active)',
      email: 'analyst@aegis-security.internal'
    }
  });
}

// GET /api/emails - Fetch stored emails
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const emails = await prisma.email.findMany({
      include: {
        analysisResults: {
          orderBy: { createdAt: 'desc' }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit))
    });

    let filtered = emails;
    if (searchQuery) {
      filtered = emails.filter((item) => {
        const s = (item.subject || '').toLowerCase();
        const snd = (item.sender || '').toLowerCase();
        const b = (item.body || '').toLowerCase();
        const id = (item.id || '').toLowerCase();
        return s.includes(searchQuery) || snd.includes(searchQuery) || b.includes(searchQuery) || id.includes(searchQuery);
      });
    }

    const formatted = filtered.map((item) => {
      const latest = item.analysisResults?.[0] || {};
      return {
        ...item,
        riskScore: latest.riskScore ?? 0,
        classification: latest.classification || 'ANALYZED',
        explanation: latest.explanation || ''
      };
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      emails: formatted,
      data: formatted
    });
  } catch (error) {
    console.error('[API /api/emails GET] Error retrieving emails from Supabase:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve emails from Supabase.' },
      { status: 500 }
    );
  }
}

// POST /api/emails - Persist email and analysis
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json.' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON in request body.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Request body must be a valid JSON object.' },
        { status: 400 }
      );
    }

    // Extract email fields
    const canonical = body.emailData || null;

    const sender =
      body.sender ||
      canonical?.metadata?.from ||
      body.from ||
      'unknown@security.internal';

    const subject =
      body.subject ||
      canonical?.metadata?.subject ||
      'Untitled Email Communication';

    const emailBody =
      body.body ||
      canonical?.body?.text ||
      canonical?.body?.html ||
      body.rawEmail ||
      body.text ||
      '[No email body content provided]';

    const riskScore =
      typeof body.riskScore === 'number'
        ? body.riskScore
        : typeof canonical?.risk?.totalScore === 'number'
        ? canonical.risk.totalScore
        : typeof body.score === 'number'
        ? body.score
        : 0;

    const classification =
      body.classification ||
      canonical?.risk?.level ||
      (riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW');

    const explanation =
      body.explanation ||
      body.summary ||
      canonical?.aiAnalysis?.summary ||
      `Forensic risk assessment: ${classification} threat level with a calculated risk score of ${riskScore}/100.`;

    const savedEmail = await autoPersistEmailToSupabase({
      sender,
      subject,
      body: emailBody,
      riskScore,
      classification,
      explanation,
      emailId: body.emailId || null
    });

    if (!savedEmail) {
      throw new Error('Database transaction failed while saving email to Supabase.');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email successfully recorded in Supabase database.',
        data: savedEmail
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/emails POST] Error saving email to Supabase:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save email to Supabase database.'
      },
      { status: 500 }
    );
  }
}
