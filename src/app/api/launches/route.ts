import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const proteinId = searchParams.get("proteinId");
    const flowchartId = searchParams.get("flowchartId");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    const where: Record<string, unknown> = {};
    if (proteinId) where.proteinId = proteinId;
    if (flowchartId) where.flowchartId = flowchartId;
    if (year) where.year = parseInt(year);
    if (month) where.month = parseInt(month);

    const launches = await prisma.launch.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        protein: { select: { id: true, name: true } },
        _count: { select: { steps: true } },
      },
    });

    return NextResponse.json(launches);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar lançamentos" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { proteinId, flowchartId } = await request.json();
    await prisma.launch.deleteMany({ where: { proteinId, flowchartId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao apagar lançamentos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { proteinId, flowchartId, flowchartName, year, month } = await request.json();

    if (!proteinId || !flowchartId || !flowchartName || !year || !month) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const launch = await prisma.launch.upsert({
      where: { proteinId_flowchartId_year_month: { proteinId, flowchartId, year, month } },
      update: {},
      create: { proteinId, flowchartId, flowchartName, year, month },
      include: { protein: { select: { id: true, name: true } } },
    });

    return NextResponse.json(launch, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar lançamento" }, { status: 500 });
  }
}
