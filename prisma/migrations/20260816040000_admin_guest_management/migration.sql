CREATE TABLE "InvitingParty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxGuestCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitingParty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpectedGuest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invitedPersons" INTEGER NOT NULL DEFAULT 1,
    "partyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpectedGuest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Rsvp" ADD COLUMN "guestCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Rsvp" ADD COLUMN "expectedGuestId" TEXT;

UPDATE "Rsvp"
SET "guestCount" = CASE WHEN "attending" THEN 1 ELSE 0 END;

CREATE UNIQUE INDEX "InvitingParty_name_key" ON "InvitingParty"("name");
CREATE INDEX "ExpectedGuest_partyId_idx" ON "ExpectedGuest"("partyId");
CREATE UNIQUE INDEX "Rsvp_expectedGuestId_key" ON "Rsvp"("expectedGuestId");

ALTER TABLE "ExpectedGuest"
ADD CONSTRAINT "ExpectedGuest_partyId_fkey"
FOREIGN KEY ("partyId") REFERENCES "InvitingParty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Rsvp"
ADD CONSTRAINT "Rsvp_expectedGuestId_fkey"
FOREIGN KEY ("expectedGuestId") REFERENCES "ExpectedGuest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
