import { prisma } from './prisma.js';

/**
 * Helper to resolve or guarantee a valid Profile in Supabase.
 * Uses the logged-in Clerk user if available, or falls back to the registered
 * SOC analyst profile so foreign key constraints are always satisfied.
 */
export async function resolveUserProfile() {
  try {
    let clerk = null;
    try {
      clerk = await import('@clerk/nextjs/server');
    } catch {
      // Standalone Node test environment or unbundled runtime
    }

    if (clerk?.auth) {
      const { userId } = await clerk.auth();

      if (userId && clerk?.currentUser) {
        const clerkUser = await clerk.currentUser();
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
    }
  } catch {
    // Unauthenticated or testing environment
  }

  // Fallback to first existing profile in Supabase
  try {
    if (!process.env.DATABASE_URL) return null;
    const existingProfile = await prisma.profile.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (existingProfile) {
      return existingProfile;
    }

    // Create guest analyst profile if no profile exists
    return await prisma.profile.upsert({
      where: { id: 'analyst_guest' },
      update: {},
      create: {
        id: 'analyst_guest',
        email: 'analyst@aegis.defense',
        name: 'SOC Lead Analyst'
      }
    });
  } catch (err) {
    console.error('[resolveUserProfile] Database error:', err);
    throw err;
  }
}

/**
 * Automatically persists or updates an email and its analysis result in Supabase
 *
 * @param {Object} params
 * @param {string} params.sender - Email sender address
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body or raw content
 * @param {number} [params.riskScore=0] - Risk score (0-100)
 * @param {string} [params.classification='ANALYZED'] - Threat classification
 * @param {string} [params.explanation=''] - Forensic explanation
 * @param {string} [params.emailId] - Optional existing email ID to update
 * @returns {Promise<Object>} The persisted email record with analysisResults
 */
export async function autoPersistEmailToSupabase({
  sender,
  subject,
  body,
  riskScore = 0,
  classification = 'ANALYZED',
  explanation = '',
  emailId = null
}) {
  try {
    if (!process.env.DATABASE_URL) return null;
    const profile = await resolveUserProfile();
    if (!profile) return null;

    const cleanSender = String(sender || 'unknown@domain.com').slice(0, 255);
    const cleanSubject = String(subject || '(No Subject)').slice(0, 500);
    const cleanBody = String(body || '');
    const cleanScore = Math.min(100, Math.max(0, parseInt(riskScore, 10) || 0));
    const cleanClass = String(classification || 'ANALYZED').slice(0, 50);
    const cleanExplanation = String(explanation || '');

    // Transactional save to Supabase
    const saved = await prisma.$transaction(async (tx) => {
      let emailRecord;

      if (emailId) {
        const existing = await tx.email.findUnique({ where: { id: emailId } });
        if (existing) {
          emailRecord = await tx.email.update({
            where: { id: emailId },
            data: {
              sender: cleanSender,
              subject: cleanSubject,
              body: cleanBody || existing.body
            }
          });
        }
      }

      if (!emailRecord) {
        emailRecord = await tx.email.create({
          data: {
            userId: profile.id,
            sender: cleanSender,
            subject: cleanSubject,
            body: cleanBody
          }
        });
      }

      const analysisRecord = await tx.analysisResult.create({
        data: {
          emailId: emailRecord.id,
          riskScore: cleanScore,
          classification: cleanClass,
          explanation: cleanExplanation
        }
      });

      return {
        ...emailRecord,
        riskScore: cleanScore,
        classification: cleanClass,
        explanation: cleanExplanation,
        analysisResults: [analysisRecord]
      };
    });

    return saved;
  } catch (err) {
    console.error('[autoPersistEmailToSupabase] Error automatically persisting to Supabase:', err);
    return null;
  }
}
