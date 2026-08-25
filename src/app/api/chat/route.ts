import { NextResponse } from "next/server";
import { z } from "zod";
import { computeBI, resultEnvelope } from "@/lib/analytics";
import { synthesizeAnswer, understandQuery } from "@/lib/ai";
import { readBusinessBoards } from "@/lib/monday";
import { normalizeRecords } from "@/lib/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ question: z.string().trim().min(3).max(1000) });

export async function POST(request: Request) {
  try {
    const { question } = bodySchema.parse(await request.json());
    const plan = await understandQuery(question);
    if (plan.needsClarification && plan.clarificationQuestion) {
      return NextResponse.json({ clarification: plan.clarificationQuestion, plan });
    }
    const raw = await readBusinessBoards();
    const normalized = normalizeRecords(raw.deals.records, raw.workOrders.records);
    const computed = computeBI(normalized.deals, normalized.workOrders, plan);
    const answer = await synthesizeAnswer(question, { ...computed.facts, caveats: computed.caveats }, computed.fallback);
    return NextResponse.json(resultEnvelope(answer, plan, computed, normalized.deals.length, normalized.workOrders.length));
  } catch (error) {
    const message = error instanceof z.ZodError ? "Please enter a specific business question." : error instanceof Error ? error.message : "Unexpected error.";
    const status = /configured|board|Monday/.test(message) ? 503 : 500;
    return NextResponse.json({ error: message, hint: status === 503 ? "Check the server-side environment variables and board access in Setup." : "Retry the question. No Monday.com data was modified." }, { status });
  }
}
