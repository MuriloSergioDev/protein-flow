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
    const flowcharts = await prisma.flowchart.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, nodes: true, edges: true, updatedAt: true },
    });
    return NextResponse.json(flowcharts);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar fluxogramas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { name, nodes, edges } = await request.json();
    const flowchart = await prisma.flowchart.create({
      data: { userId: user.id, name, nodes, edges },
      select: { id: true, name: true, nodes: true, edges: true, updatedAt: true },
    });
    return NextResponse.json(flowchart, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar fluxograma" }, { status: 500 });
  }
}
