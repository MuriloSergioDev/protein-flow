import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getLaunchForUser(id: string, userId: string) {
  return prisma.launch.findFirst({
    where: { id, protein: { userId } },
    include: {
      protein: { select: { id: true, name: true } },
      steps: { orderBy: { id: "asc" } },
    },
  });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const launch = await getLaunchForUser(id, user.id);
    if (!launch) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json(launch);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar lançamento" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const existing = await getLaunchForUser(id, user.id);
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const { steps, complete } = await request.json();

    await prisma.launchStep.deleteMany({ where: { launchId: id } });
    if (steps.length > 0) {
      await prisma.launchStep.createMany({
        data: steps.map((step: { nodeId: string; type: string; content?: string; photoUrl?: string; quantity?: number; completed: boolean }) => ({
          launchId: id,
          nodeId: step.nodeId,
          type: step.type,
          content: step.content ?? null,
          photoUrl: step.photoUrl ?? null,
          quantity: step.quantity ?? null,
          completedAt: step.completed ? new Date() : null,
        })),
      });
    }

    const allCompleted = steps.length > 0 && steps.every((s: { completed: boolean }) => s.completed);
    const launch = await prisma.launch.update({
      where: { id },
      data: {
        status: complete || allCompleted ? "completed" : "in_progress",
        completedAt: complete || allCompleted ? new Date() : null,
      },
      include: {
        protein: { select: { id: true, name: true } },
        steps: { orderBy: { id: "asc" } },
      },
    });
    return NextResponse.json(launch);
  } catch {
    return NextResponse.json({ error: "Erro ao salvar lançamento" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const existing = await getLaunchForUser(id, user.id);
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    await prisma.launch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao apagar lançamento" }, { status: 500 });
  }
}
