-- expiresAt, timeSpentSec, offlineToken were carried over from the
-- leadership-assessment merge but never read or written by any code path
-- (confirmed via a full-repo grep, api + web). Dropping them.
ALTER TABLE "assessment_sessions" DROP COLUMN "expiresAt";
ALTER TABLE "assessment_sessions" DROP COLUMN "timeSpentSec";
ALTER TABLE "assessment_sessions" DROP COLUMN "offlineToken";
