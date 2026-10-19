import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

// ---------------------------------------------------------------
// Authorization layer. Postgres RLS is the gold standard when the
// DB is queried from multiple services/roles; here, since every
// query flows through this one Next.js backend via Prisma, we
// enforce the equivalent guarantee at the query layer: every read
// or write of a Registration is scoped to req.session.user.id
// (or ADMIN). No endpoint accepts a bare registrationId without
// this check — see app/api/registrations/[id]/route.ts.
//
// If you later expose the DB to other services, mirror these same
// predicates as native Postgres RLS policies (see prisma/rls.sql).
// ---------------------------------------------------------------

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { user: null, error: "Unauthorized" as const };
  }
  return { user: session.user as { id: string; role: string; email: string }, error: null };
}

export async function requireOwnedRegistration(registrationId: string, userId: string, role: string) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { players: true, payment: true },
  });

  if (!registration) return { registration: null, error: "NotFound" as const };

  if (registration.userId !== userId && role !== "ADMIN") {
    // Return NotFound rather than Forbidden — avoids confirming
    // the record exists to a user who shouldn't see it at all.
    return { registration: null, error: "NotFound" as const };
  }

  return { registration, error: null };
}
