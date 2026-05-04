CREATE TABLE "Testimonial" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "location" TEXT,
  "quote" TEXT NOT NULL,
  "rating" INTEGER,
  "photoUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "isFeatured" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Testimonial_status_isFeatured_order_idx" ON "Testimonial"("status", "isFeatured", "order");
