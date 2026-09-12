import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/emails/[id]
 * Fetches a single dynamic email by its UUID from Supabase.
 */
export async function GET(_request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing email ID.' },
        { status: 400 }
      );
    }

    const email = await prisma.email.findUnique({
      where: { id },
      include: {
        analysisResults: {
          orderBy: { createdAt: 'desc' }
        },
        user: true
      }
    });

    if (!email) {
      return NextResponse.json(
        { success: false, error: `Email record with ID ${id} was not found in Supabase.` },
        { status: 404 }
      );
    }

    const latest = email.analysisResults?.[0] || {};
    const formattedEmail = {
      ...email,
      riskScore: latest.riskScore ?? 0,
      classification: latest.classification || 'ANALYZED',
      explanation: latest.explanation || ''
    };

    return NextResponse.json({
      success: true,
      email: formattedEmail,
      data: formattedEmail
    });
  } catch (error) {
    console.error(`[API /api/emails/[id] GET] Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve email record.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/emails/[id]
 * Deletes an email from Supabase.
 */
export async function DELETE(_request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing email ID.' },
        { status: 400 }
      );
    }

    await prisma.email.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: `Email ${id} successfully deleted from Supabase.`
    });
  } catch (error) {
    console.error(`[API /api/emails/[id] DELETE] Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete email record.' },
      { status: 500 }
    );
  }
}
