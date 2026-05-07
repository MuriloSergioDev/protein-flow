import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const { name, nodes, edges } = await request.json();
    const flowchart = await prisma.flowchart.update({
      where: { id, userId: user.id },
      data: { name, nodes, edges },
      select: { id: true, name: true, nodes: true, edges: true, updatedAt: true },
    });
    return NextResponse.json(flowchart);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar fluxograma" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.flowchart.delete({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao apagar fluxograma" }, { status: 500 });
  }
}
