import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_ORG_ID = "default";

async function ensureDefaultOrg() {
  const existing = await prisma.organization.findUnique({ where: { id: DEFAULT_ORG_ID } });
  if (!existing) {
    await prisma.organization.create({ data: { id: DEFAULT_ORG_ID, name: "Padrão" } });
  }
}

export async function GET() {
  try {
    const proteins = await prisma.protein.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, description: true },
    });
    return NextResponse.json(proteins);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar proteínas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }
    await ensureDefaultOrg();
    const protein = await prisma.protein.create({
      data: { name: name.trim(), description: description?.trim() || null, organizationId: DEFAULT_ORG_ID },
      select: { id: true, name: true, description: true },
    });
    return NextResponse.json(protein, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar proteína" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.protein.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao apagar proteína" }, { status: 500 });
  }
}
