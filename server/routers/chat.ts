import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { getPolicyById, getDb } from "../db";
import { chatMessages, ragDocuments } from "../../drizzle/schema";
import { eq, desc, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── Built-in LTC knowledge base ──────────────────────────────────────────────
const BUILTIN_KNOWLEDGE = `
GLOSSARY OF LTC INSURANCE TERMS:
- Elimination Period: The number of service days you must pay out of pocket before your LTC policy begins paying. This counts days of actual service, not calendar days since illness onset.
- Daily Maximum: The maximum amount the insurance company pays per day of care. Costs above this are the client's responsibility.
- Monthly Maximum: The maximum amount payable per month of care.
- Lifetime Maximum: The total amount the policy will pay over its entire lifetime.
- ADL (Activity of Daily Living): The six core functions — Bathing, Dressing, Eating/Feeding, Toileting, Transferring, Continence. Most policies require 2–3 ADL deficits to qualify.
- IADL (Instrumental Activity of Daily Living): Higher-level functions — Meal Preparation, Medication Management, Housekeeping, Laundry, Shopping/Errands, Transportation, Money Management, Telephone Use.
- Case Manager: Assigned by the LTC insurance company to determine approved hours of care and monitor the case regularly.
- Third-Party Assessment: An independent RN assessment (ordered by the carrier) to verify the patient's condition and ADL deficits. Be consistent and honest — inconsistencies can lead to denial.
- Waiver of Premium: Waives ongoing premium payments once care begins under the policy.
- Assignment of Benefits (AOB): Redirects insurance payment directly to the care provider instead of the insured.
- Claim/Pre-Claim Number: When a claim is initiated, a pre-claim number is issued. Upon approval it becomes the official claim number.
- Payment Cycle: The review cycle for invoices and care logs (monthly or other interval).
- CNA Required: Some policies require a Certified Nursing Assistant to provide care.
- Plan of Care: A written document from the care provider outlining the specific care services to be provided.
- Look-Back Period: Some policies require a qualifying period of care before benefits begin.

STRATEGY STAGES:
Stage 1 — Prior to Claim (Days 1–25):
- Contact the carrier and request the claims packet by mail. DO NOT initiate the claim yet — only request information.
- Evaluate the long-term care need and identify physical/cognitive decline.
- Identify ADL deficits (minimum 2 ADLs required for most policies).
- Notify all healthcare providers IN WRITING of intent to file an LTC claim.
- Secure a home care provider experienced with LTC insurance requirements.
- Gather all documentation: provider license, Plan of Care, W-9, POA, insurance declaration page.
- Begin services to trigger the elimination period.

Stage 2 — Filing the Claim (Days 26–63):
- Complete the claim packet thoroughly and create a document index.
- Attach ALL documents in ONE submission — never in pieces.
- Prepare for the third-party RN evaluation.
- Understand the 30-day review period after submission.
- Ensure the policy number appears on every page of every submitted document.

Stage 3 — Post-Approval (Day 64+):
- Continue paying for care during the elimination period.
- Submit invoices and care logs on the carrier's payment cycle.
- Ensure the policy number appears on every invoice and log sheet.
- Monitor for case manager check-ins and respond promptly.
- Track benefits used against the lifetime maximum.

CRITICAL RULES:
- NEVER initiate a claim until all Stage 1 documentation is gathered.
- Submit ALL documents in ONE packet — never piecemeal.
- Policy number MUST appear on every page of every submitted document.
- Third-party evaluations look for inconsistencies — be honest and thorough.
- Appeals after denial have low success rates — prevention is key.
- The elimination period counts service days, not calendar days.

COMMON MISTAKES TO AVOID:
1. Initiating the claim before gathering all documentation.
2. Submitting documents in multiple batches instead of one complete packet.
3. Forgetting the policy number on submitted pages.
4. Inconsistent ADL documentation across different providers.
5. Not notifying providers in writing before the claim.
6. Choosing a care provider unfamiliar with LTC insurance requirements.

ABOUT SC VISITING ANGELS:
SC Visiting Angels (scvisitingangels.com) is a home care agency in South Carolina specializing in long-term care insurance claims. They help families navigate the LTC claims process from start to finish, including documentation, provider setup, and carrier communication. Phone: (803) 749-0026. Email: info@scvisitingangels.com.
`;

// ── Keyword-based RAG retrieval from ragDocuments table ───────────────────────
async function retrieveRelevantDocs(query: string, limit = 3): Promise<string[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const keywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    if (keywords.length === 0) return [];

    // Build OR conditions for keyword matching
    const conditions = keywords.slice(0, 5).map((kw: string) =>
      or(
        like(ragDocuments.content, `%${kw}%`),
        like(ragDocuments.title, `%${kw}%`)
      )
    );

    const docs = await db
      .select({ title: ragDocuments.title, content: ragDocuments.content })
      .from(ragDocuments)
      .where(or(...conditions.filter(Boolean) as any[]))
      .limit(limit);

    return docs.map((d: { title: string; content: string }) => `[${d.title}]\n${d.content.slice(0, 600)}`);
  } catch {
    return [];
  }
}

// ── Save message to chatMessages table ───────────────────────────────────────
async function saveMessage(sessionId: string, role: "user" | "assistant", content: string) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(chatMessages).values({ sessionId, role, content });
  } catch {
    // Non-blocking — don't fail the chat if DB write fails
  }
}

// ── Get recent history from chatMessages table ────────────────────────────────
async function getHistory(sessionId: string, limit = 10) {
  try {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({ role: chatMessages.role, content: chatMessages.content })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    return rows.reverse();
  } catch {
    return [];
  }
}

// ── Chat router ───────────────────────────────────────────────────────────────
export const chatRouter = router({
  send: publicProcedure
    .input(z.object({
      message: z.string().min(1).max(2000),
      sessionId: z.string().optional(),
      policyId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const sessionId = input.sessionId || nanoid();

      // 1. Save user message
      await saveMessage(sessionId, "user", input.message);

      // 2. Retrieve relevant docs from knowledge base
      const relevantDocs = await retrieveRelevantDocs(input.message);
      const ragContext = relevantDocs.length > 0
        ? `\nRELEVANT KNOWLEDGE BASE DOCUMENTS:\n${relevantDocs.join("\n\n")}\n`
        : "";

      // 3. Inject policy context if available
      let policyContext = "";
      if (input.policyId) {
        try {
          const policy = await getPolicyById(input.policyId);
          if (policy) {
            policyContext = `
USER'S POLICY CONTEXT:
- Insured: ${policy.insuredFullName || "Not provided"}
- Policy #: ${policy.policyNumber || "Not provided"}
- Carrier: ${policy.carrierName || "Not provided"}
- Elimination Period: ${policy.eliminationPeriod || "Not provided"}
- Daily Maximum: ${policy.dailyMaximum || "Not provided"}
- Monthly Maximum: ${policy.monthlyMaximum || "Not provided"}
- Lifetime Maximum: ${policy.lifetimeMaximum || "Not provided"}
- Min ADLs Required: ${policy.minAdlsRequired || "Not provided"}
`;
          }
        } catch {
          // Non-blocking
        }
      }

      // 4. Get recent conversation history
      const history = await getHistory(sessionId, 8);
      const historyMessages = history
        .filter((m: { role: string; content: string }) => m.role === "user" || m.role === "assistant")
        .map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content }));

      // 5. Build system prompt
      const systemPrompt = `You are a warm, knowledgeable, and empathetic long-term care insurance support assistant for SC Visiting Angels (scvisitingangels.com). You help families understand their LTC insurance policies, navigate the claims process, and make confident decisions during a stressful time.

${policyContext}

${BUILTIN_KNOWLEDGE}
${ragContext}

RESPONSE GUIDELINES:
- Be warm, supportive, and clear. Avoid jargon unless you explain it.
- When referencing the user's policy, use their specific details.
- For complex questions, break your answer into clear steps.
- Always recommend consulting with SC Visiting Angels or a licensed professional for specific legal or medical advice.
- Keep responses concise but complete — aim for 2–4 paragraphs maximum.
- Use markdown formatting (bold, bullet points) to improve readability.
- If you don't know something specific, say so honestly and suggest next steps.`;

      // 6. Invoke LLM
      const result = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          ...historyMessages,
          { role: "user", content: input.message },
        ],
      });

      const assistantContent =
        typeof result.choices[0].message.content === "string"
          ? result.choices[0].message.content
          : JSON.stringify(result.choices[0].message.content);

      // 7. Save assistant response
      await saveMessage(sessionId, "assistant", assistantContent);

      return { content: assistantContent, sessionId };
    }),

  getHistory: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const rows = await getHistory(input.sessionId, 50);
      return rows.map((r: { role: string; content: string }) => ({ role: r.role, content: r.content }));
    }),
});
