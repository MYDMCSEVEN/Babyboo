-- CreateTable
CREATE TABLE "LimiteEssai" (
    "cle" TEXT NOT NULL,
    "compteur" INTEGER NOT NULL DEFAULT 0,
    "debut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LimiteEssai_pkey" PRIMARY KEY ("cle")
);

-- CreateIndex
CREATE INDEX "LimiteEssai_debut_idx" ON "LimiteEssai"("debut");

