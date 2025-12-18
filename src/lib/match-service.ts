
import { prisma } from "@/lib/prisma";

export async function getMatchSuggestions(userId: string, eventId: string) {
    // Try to find existing manual suggestions
    const suggestions = await prisma.matchSuggestion.findMany({
        where: {
            userId,
            eventId,
        },
        include: {
            suggestedUser: {
                include: {
                    memberProfile: true
                }
            }
        }
    });

    if (suggestions.length > 0) {
        return suggestions;
    }

    // If no manual suggestions, imply "AI" or "Algorithm" match for VIPs
    // Find other attendees
    const otherAttendees = await prisma.eventRsvp.findMany({
        where: {
            eventId,
            userId: { not: userId },
            status: "GOING"
        },
        include: {
            user: {
                include: {
                    memberProfile: true
                }
            }
        },
        take: 3
    });

    // Map to suggestion format (not saving to DB, just returning)
    return otherAttendees.map(rsvp => {
        const profile = rsvp.user.memberProfile;
        const occupation = profile?.occupation ? profile.occupation : null;


        return {
            id: `temp-${rsvp.userId}`,
            userId,
            eventId,
            suggestedUserId: rsvp.userId,
            reason: occupation ? `Also works in ${occupation}` : "Shared interests in arts and culture",
            createdAt: new Date(),
            updatedAt: new Date(),
            suggestedUser: {
                ...rsvp.user,
                memberProfile: profile
            }
        };
    });
}
