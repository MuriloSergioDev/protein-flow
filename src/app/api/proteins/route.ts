import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const proteins = await prisma.protein.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, description: true },
    });
    return NextResponse.json(proteins);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar proteínas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { name, description } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }
    const protein = await prisma.protein.create({
      data: { userId: user.id, name: name.trim(), description: description?.trim() || null },
      select: { id: true, name: true, description: true },
    });
    return NextResponse.json(protein, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar proteína" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = await request.json();
    await prisma.protein.delete({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao apagar proteína" }, { status: 500 });
  }
}
