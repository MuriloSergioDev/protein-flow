import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const { name, description } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }
    const protein = await prisma.protein.update({
      where: { id, userId: user.id },
      data: { name: name.trim(), description: description ?? null },
      select: { id: true, name: true, description: true },
    });
    return NextResponse.json(protein);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar proteína" }, { status: 500 });
  }
}
