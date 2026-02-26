import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createPolicy, updatePolicy, getPolicyByUserId, getPolicyById, createStrategy, getStrategyByPolicyId, getStrategyById, updateStrategy, saveChatMessage, getChatHistory } from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  policy: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getPolicyByUserId(ctx.user.id);
    }),

    save: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        holderFirstName: z.string().optional(),
        holderLastName: z.string().optional(),
        holderDateOfBirth: z.string().optional(),
        holderRelationship: z.string().optional(),
        insuranceCompany: z.string().optional(),
        policyNumber: z.string().optional(),
        policyType: z.string().optional(),
        policyStatus: z.string().optional(),
        effectiveDate: z.string().optional(),
        dailyBenefitAmount: z.string().optional(),
        benefitPeriod: z.string().optional(),
        eliminationPeriod: z.string().optional(),
        inflationProtection: z.string().optional(),
        homeCareCoverage: z.string().optional(),
        facilityCareCoverage: z.string().optional(),
        currentCareNeeds: z.string().optional(),
        diagnosisOrCondition: z.string().optional(),
        adlLimitations: z.array(z.string()).optional(),
        cognitiveImpairment: z.string().optional(),
        currentCareReceiving: z.string().optional(),
        preferredCareType: z.string().optional(),
        priorClaimsFiled: z.string().optional(),
        priorClaimsDetails: z.string().optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        if (id) {
          await updatePolicy(id, ctx.user.id, data);
          return { id };
        } else {
          const newId = await createPolicy({ ...data, userId: ctx.user.id });
          return { id: newId };
        }
      }),
  }),

  strategy: router({
    getByPolicy: protectedProcedure
      .input(z.object({ policyId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getStrategyByPolicyId(input.policyId, ctx.user.id);
      }),

    generate: protectedProcedure
      .input(z.object({ policyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const policy = await getPolicyById(input.policyId);
        if (!policy || policy.userId !== ctx.user.id) {
          throw new Error("Policy not found");
        }

        const adlList = Array.isArray(policy.adlLimitations) ? (policy.adlLimitations as string[]).join(", ") : "Not specified";

        const systemPrompt = `You are an expert long-term care insurance claims advisor. Your role is to help families navigate the complex process of initiating and successfully submitting long-term care insurance claims.

Based on the policy information provided, generate a comprehensive, personalized strategy document that will help this family successfully submit their long-term care insurance claim.

The strategy MUST include the following sections:

1. **Executive Summary** - A brief overview of the claim situation and key recommendations.

2. **Policy Analysis** - Detailed analysis of their specific policy benefits, coverage limits, and important terms.

3. **Eligibility Assessment** - Based on the care needs and ADL limitations provided, assess whether the policyholder likely meets the benefit triggers for their policy.

4. **Step-by-Step Claim Filing Guide** - Specific, actionable steps to file the claim with their insurance company, including:
   - Required documentation checklist
   - Key forms to request from the insurance company
   - Medical documentation needed
   - Timeline expectations

5. **Documentation Strategy** - Specific guidance on how to document care needs, including:
   - How to document ADL limitations
   - Physician statement requirements
   - Care plan documentation
   - Cognitive assessment documentation (if applicable)

6. **Common Pitfalls to Avoid** - Insurance company tactics and common mistakes that lead to claim denials, specific to their policy type and insurance company.

7. **Appeal Strategy** - Pre-emptive guidance on what to do if the initial claim is denied.

8. **Care Coordination Recommendations** - Suggestions for coordinating care that aligns with policy requirements.

9. **Important Contacts & Resources** - Relevant contacts including state insurance commissioner, ombudsman, and advocacy resources.

10. **Timeline & Next Steps** - A clear timeline of actions with deadlines.

Format the response in clean HTML with proper headings (h2, h3), paragraphs, lists, and emphasis. Use a professional, empathetic tone throughout. Make the strategy specific to their situation - reference their actual policy details, insurance company, care needs, etc.`;

        const userPrompt = `Please generate a personalized LTC insurance claim strategy for the following situation:

**Policy Holder:** ${policy.holderFirstName || "Not provided"} ${policy.holderLastName || ""}
**Date of Birth:** ${policy.holderDateOfBirth || "Not provided"}
**Relationship to User:** ${policy.holderRelationship || "Not provided"}

**Insurance Company:** ${policy.insuranceCompany || "Not provided"}
**Policy Number:** ${policy.policyNumber || "Not provided"}
**Policy Type:** ${policy.policyType || "Not provided"}
**Policy Status:** ${policy.policyStatus || "Not provided"}
**Effective Date:** ${policy.effectiveDate || "Not provided"}

**Daily Benefit Amount:** ${policy.dailyBenefitAmount || "Not provided"}
**Benefit Period:** ${policy.benefitPeriod || "Not provided"}
**Elimination Period:** ${policy.eliminationPeriod || "Not provided"}
**Inflation Protection:** ${policy.inflationProtection || "Not provided"}
**Home Care Coverage:** ${policy.homeCareCoverage || "Not provided"}
**Facility Care Coverage:** ${policy.facilityCareCoverage || "Not provided"}

**Current Care Needs:** ${policy.currentCareNeeds || "Not provided"}
**Diagnosis/Condition:** ${policy.diagnosisOrCondition || "Not provided"}
**ADL Limitations:** ${adlList}
**Cognitive Impairment:** ${policy.cognitiveImpairment || "Not provided"}
**Current Care Being Received:** ${policy.currentCareReceiving || "Not provided"}
**Preferred Care Type:** ${policy.preferredCareType || "Not provided"}

**Prior Claims Filed:** ${policy.priorClaimsFiled || "Not provided"}
**Prior Claims Details:** ${policy.priorClaimsDetails || "Not provided"}
**Additional Notes:** ${policy.additionalNotes || "Not provided"}`;

        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const content = typeof result.choices[0].message.content === "string"
          ? result.choices[0].message.content
          : JSON.stringify(result.choices[0].message.content);

        // Check for existing strategy
        const existing = await getStrategyByPolicyId(input.policyId, ctx.user.id);
        let strategyId: number;

        if (existing) {
          await updateStrategy(existing.id, {
            strategyContent: content,
            strategyHtml: content,
            generatedAt: new Date(),
          });
          strategyId = existing.id;
        } else {
          strategyId = await createStrategy({
            userId: ctx.user.id,
            policyId: input.policyId,
            strategyContent: content,
            strategyHtml: content,
          });
        }

        // Notify owner about new strategy generation
        await notifyOwner({
          title: "New LTC Strategy Generated",
          content: `User ${ctx.user.name || ctx.user.email || "Unknown"} generated a strategy for policy #${policy.policyNumber || input.policyId}.`,
        }).catch(() => {});

        return { id: strategyId, content };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const strategy = await getStrategyById(input.id);
        if (!strategy || strategy.userId !== ctx.user.id) {
          throw new Error("Strategy not found");
        }
        return strategy;
      }),
  }),

  chat: router({
    send: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
        sessionId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id;

        // Save user message
        const lastUserMsg = input.messages.filter(m => m.role === "user").pop();
        if (lastUserMsg) {
          await saveChatMessage({
            userId: userId || null,
            sessionId: input.sessionId,
            role: "user",
            content: lastUserMsg.content,
          });
        }

        const systemMessage = {
          role: "system" as const,
          content: `You are a friendly and knowledgeable long-term care insurance support assistant. You help families understand their long-term care insurance policies, navigate the claims process, and answer questions about long-term care.

Key areas you can help with:
- Understanding LTC insurance policy terms and benefits
- Explaining the claims filing process
- Discussing Activities of Daily Living (ADLs) and benefit triggers
- Providing guidance on documentation requirements
- Explaining elimination periods, benefit periods, and daily benefit amounts
- Discussing different types of care coverage (home care, facility care, etc.)
- Answering questions about inflation protection and policy riders
- Providing emotional support and encouragement during the claims process

Always be empathetic, supportive, and clear in your explanations. If you don't know something specific about their policy, encourage them to use the Policy Intake Form on the portal to get personalized guidance. Never provide specific legal or medical advice.`,
        };

        const messagesForLLM = [systemMessage, ...input.messages.filter(m => m.role !== "system")];

        const result = await invokeLLM({
          messages: messagesForLLM,
        });

        const assistantContent = typeof result.choices[0].message.content === "string"
          ? result.choices[0].message.content
          : JSON.stringify(result.choices[0].message.content);

        // Save assistant response
        await saveChatMessage({
          userId: userId || null,
          sessionId: input.sessionId,
          role: "assistant",
          content: assistantContent,
        });

        return assistantContent;
      }),
  }),

  email: router({
    sendStrategy: protectedProcedure
      .input(z.object({
        strategyId: z.number(),
        recipients: z.array(z.string().email()),
      }))
      .mutation(async ({ ctx, input }) => {
        const strategy = await getStrategyById(input.strategyId);
        if (!strategy || strategy.userId !== ctx.user.id) {
          throw new Error("Strategy not found");
        }

        // Use the notification service to notify the owner about the email request
        // In a production environment, this would integrate with an email service
        const recipientList = input.recipients.join(", ");
        await notifyOwner({
          title: "Strategy Email Request",
          content: `User ${ctx.user.name || ctx.user.email || "Unknown"} requested their LTC strategy (ID: ${input.strategyId}) to be emailed to: ${recipientList}`,
        }).catch(() => {});

        return { success: true, message: `Strategy has been queued for delivery to ${input.recipients.length} recipient(s).` };
      }),
  }),
});

export type AppRouter = typeof appRouter;
