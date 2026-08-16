CREATE TABLE "Rsvp" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "numberOfAttendees" INTEGER NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "attending" BOOLEAN NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Rsvp_createdAt_idx" ON "Rsvp"("createdAt");
