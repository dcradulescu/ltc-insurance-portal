import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import {
  retrieveRelevantDocuments,
  buildRAGContext,
  createChatSession,
  getChatSession,
  saveEnhancedChatMessage,
  getRecentChatContext,
  updateChatSession,
} from "../rag";
import { getPolicyById } from "../db";
import { nanoid } from "nanoid";

/**
 * Enhanced Chat Router with:
 * 1. Dynamic RAG - Retrieves relevant documents based on user query
 * 2. User Context - Injects user's policy data into chat context
 * 3. Multi-turn Memory - Maintains conversation history and session state
 */

export const chatRouter = router({
  /**
   * Send a message with full RAG, context, and memory support
   */
  send: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          })
        ),
        sessionId: z.string().optional(),
        policyId: z.number().optional(),
        userId: z.number().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      // Initialize or retrieve session
      let sessionId = input.sessionId || nanoid();
      let session = await getChatSession(sessionId);

      if (!session || session.length === 0) {
        await createChatSession({
          sessionId,
          userId: input.userId,
          policyId: input.policyId,
        });
      }

      // Get the last user message
      const lastUserMsg = input.messages
        .filter((m: any) => m.role === "user")
        .pop();

      if (!lastUserMsg) {
        throw new Error("No user message found");
      }

      // Save user message to database
      await saveEnhancedChatMessage({
        sessionId,
        userId: input.userId,
        role: "user",
        content: lastUserMsg.content,
      });

      // ===== PHASE 1: DYNAMIC RAG =====
      // Retrieve relevant documents based on user query
      const relevantDocs = await retrieveRelevantDocuments(
        lastUserMsg.content,
        5
      );

      const ragContext = buildRAGContext(
        relevantDocs.map((doc) => ({
          title: doc.title,
          content: doc.content,
        }))
      );

      // ===== PHASE 2: USER CONTEXT =====
      // Inject user's policy data into chat context
      let userContextData: Record<string, any> = {};
      let userContextStr = "";

      if (input.policyId) {
        try {
          const policy = await getPolicyById(input.policyId);
          if (policy) {
            userContextData = {
              insuredName: policy.insuredFullName,
              policyNumber: policy.policyNumber,
              carrierName: policy.carrierName,
              eliminationPeriod: policy.eliminationPeriod,
              dailyMax: policy.dailyMaximum,
              monthlyMax: policy.monthlyMaximum,
              lifetimeMax: policy.lifetimeMaximum,
              minAdls: policy.minAdlsRequired,
            };

            userContextStr = `
USER'S POLICY CONTEXT:
- Insured: ${policy.insuredFullName}
- Policy #: ${policy.policyNumber}
- Carrier: ${policy.carrierName}
- Elimination Period: ${policy.eliminationPeriod}
- Daily Max: ${policy.dailyMaximum}
- Monthly Max: ${policy.monthlyMaximum}
- Lifetime Max: ${policy.lifetimeMaximum}
- Min ADLs Required: ${policy.minAdlsRequired}
`;
          }
        } catch (error) {
          console.warn("Failed to load user policy context:", error);
        }
      }

      // ===== PHASE 3: MULTI-TURN MEMORY =====
      // Get recent chat history for context
      const recentMessages = await getRecentChatContext(sessionId, 10);
      const conversationHistory = recentMessages
        .map((msg) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        }))
        .filter((msg) => msg.role !== "system");

      // ===== BUILD ENHANCED SYSTEM PROMPT =====
      const systemMessage = {
        role: "system" as const,
        content: `You are a friendly and knowledgeable long-term care insurance support assistant for the LTC Navigator portal. You help families understand their LTC insurance policies and navigate the claims process.

${userContextStr}

${ragContext}

KEY KNOWLEDGE BASE (Built-in Context):

GLOSSARY:
- Claim/Pre-Claim Number: When a claim is initiated, a pre-claim number is issued prior to approval. When approved, it becomes the actual claim number.
- Elimination Period: The number of service days you must pay out of pocket before your LTC policy begins to pay. This counts days of service, not days since illness.
- Daily Maximum: The maximum amount the insurance company will pay per day of service. Amounts above this are the client's responsibility.
- Monthly Maximum: The maximum amount per month of service.
- Lifetime Maximum: The total amount the policy will pay over its lifetime.
- Min # ADLs Compromised: Activities of Daily Living (Bathing, Dressing, Toileting, Feeding, Continence, Transferring). Typically 2-3 must be in deficit to qualify.
- Case Manager: Assigned by the LTC company to determine approved hours of care. They monitor the case regularly.
- Third Party Assessment: An independent RN assessment to verify the patient's condition and ADL deficits.
- Waiver of Premium: Waives premium payments once care begins under the policy.
- Payment Cycle: The review cycle for invoices and logsheets (monthly or other interval).
- CNA Caregiver Required: Some companies require a Certified Nursing Assistant to provide care.
- Assignment of Benefits (AOB): Redirects insurance payment directly to the care provider instead of the insured.

STRATEGY STAGES:
- Stage 1 (Prior to Claim): Contact carrier, request claims packet (do NOT initiate claim yet), evaluate needs, identify ADL deficits, secure home care provider, gather all documentation.
- Stage 2 (The Claim): Complete claim packet, attach all documents in ONE submission, prepare for third-party evaluation, understand 30-day review period.
- Stage 3 (Post-Approval): Continue elimination period payments, submit invoices and care logs, ensure policy number on every page.

IMPORTANT RULES:
- NEVER initiate a claim until all documentation is gathered (Stage 1 complete)
- Submit ALL documents in ONE packet - never in pieces
- Policy number MUST appear on every page of submitted documents
- Third-party evaluations look for inconsistencies - be honest and thorough
- Appeals after denial have low success rates - prevention is key

Always be empathetic and supportive. Reference the user's specific policy details when relevant. If you don't know something specific, encourage them to use the Policy Form or contact the team.`,
      };

      // ===== INVOKE LLM WITH ENHANCED CONTEXT =====
      const messagesForLLM = [
        systemMessage,
        ...conversationHistory,
        { role: "user" as const, content: lastUserMsg.content },
      ];

      const result = await invokeLLM({ messages: messagesForLLM });
      const assistantContent =
        typeof result.choices[0].message.content === "string"
          ? result.choices[0].message.content
          : JSON.stringify(result.choices[0].message.content);

      // ===== SAVE ENHANCED MESSAGE WITH METADATA =====
      await saveEnhancedChatMessage({
        sessionId,
        userId: input.userId,
        role: "assistant",
        content: assistantContent,
        retrievedDocuments: relevantDocs.map((doc) => ({
          docId: doc.docId,
          title: doc.title,
          relevanceScore: doc.relevanceScore,
        })),
        userContext: userContextData,
      });

      // ===== UPDATE SESSION METADATA =====
      // Detect conversation topic from user message
      const topicKeywords = [
        "claim",
        "elimination",
        "adl",
        "coverage",
        "benefit",
        "approval",
        "denial",
        "appeal",
        "documentation",
        "assessment",
      ];
      const detectedTopic = topicKeywords.find((keyword) =>
        lastUserMsg.content.toLowerCase().includes(keyword)
      );

      if (detectedTopic) {
        await updateChatSession(sessionId, {
          topic: detectedTopic,
        });
      }

      // Return only the content string for compatibility with ChatWidget
      // Session and document info are stored in database for later retrieval
      return assistantContent;
    }),

  /**
   * Get chat history for a session
   */
  getHistory: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input }: any) => {
      const { getRecentChatContext } = await import("../rag");
      const messages = await getRecentChatContext(input.sessionId, 100);
      return messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      }));
    }),

  /**
   * Get session metadata
   */
  getSession: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input }: any) => {
      const session = await getChatSession(input.sessionId);
      return session && session.length > 0 ? session[0] : null;
    }),

  /**
   * Clear session (archive old conversations)
   */
  clearSession: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input }: any) => {
      const { updateChatSession: updateSession } = await import("../rag");
      await updateSession(input.sessionId, {
        messageCount: 0,
      });
      return { success: true };
    }),
});
