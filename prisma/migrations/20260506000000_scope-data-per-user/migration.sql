-- DropForeignKey
ALTER TABLE "Flowchart" DROP CONSTRAINT "Flowchart_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationUser" DROP CONSTRAINT "OrganizationUser_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Protein" DROP CONSTRAINT "Protein_organizationId_fkey";

-- AlterTable
ALTER TABLE "Flowchart" DROP COLUMN "organizationId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Protein" DROP COLUMN "organizationId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Organization";

-- DropTable
DROP TABLE "OrganizationUser";
