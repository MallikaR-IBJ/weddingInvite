CREATE TYPE "AttendanceGroup" AS ENUM (
    'ONLY_MYSELF',
    'MYSELF_AND_OTHER_INVITEES',
    'COMPLICATED'
);

ALTER TABLE "Rsvp" ADD COLUMN "whoAttending" "AttendanceGroup";

UPDATE "Rsvp"
SET "whoAttending" = CASE
    WHEN "attending" = FALSE THEN NULL
    WHEN "numberOfAttendees" <= 1 THEN 'ONLY_MYSELF'::"AttendanceGroup"
    ELSE 'MYSELF_AND_OTHER_INVITEES'::"AttendanceGroup"
END;

ALTER TABLE "Rsvp" ALTER COLUMN "numberOfAttendees" DROP NOT NULL;
