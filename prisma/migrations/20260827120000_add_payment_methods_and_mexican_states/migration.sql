-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mexican_states" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mexican_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_nombre_key" ON "payment_methods"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "mexican_states_nombre_key" ON "mexican_states"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "mexican_states_clave_key" ON "mexican_states"("clave");
