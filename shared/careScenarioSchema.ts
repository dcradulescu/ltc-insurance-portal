import { z } from "zod";
// Validated on the server by calculateCare again before any financial claim is
// populated. This shape constrains transport; it is not approval by the carrier.
export const canonicalCareInputsSchema = z.object({
  paymentType:z.string().max(32),
  termsConfirmed:z.boolean(),
  eligibility:z.string().max(32),
  startDate:z.string().max(32),
  careDays:z.array(z.number().int().min(0).max(6)).max(7),
  hourlyRate:z.string().max(45),
  hoursPerDay:z.string().max(45),
  capType:z.string().max(25),
  dailyMax:z.string().max(45),
  monthlyMax:z.string().max(45),
  totalPool:z.string().max(45),
  remainingPool:z.string().max(45),
  firstMonthUsed:z.string().max(45),
  eliminationType:z.string().max(25),
  eliminationRemaining:z.string().max(45),
  monthlyPremium:z.string().max(45),
  assumeFullWaiver:z.boolean(),
  dualWaiver:z.boolean(),
  spouseMonthlyPremium:z.string().max(45),
  careInflation:z.string().max(45),
  benefitInflation:z.string().max(25),
  benefitRate:z.string().max(45),
  inflationScope:z.string().max(32),
  nextIncrease:z.string().max(32),
  riderConfirmed:z.boolean(),
  originalDaily:z.string().max(45),
  originalMonthly:z.string().max(45),
  originalPool:z.string().max(45),
}).strict();

export type CanonicalCareInputs = z.infer<typeof canonicalCareInputsSchema>;
