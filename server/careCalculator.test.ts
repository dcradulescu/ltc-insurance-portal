import { describe, expect, it } from 'vitest';
import { calculateCare, projectCare, type CareInputs } from '../shared/careCalculator';
const input: CareInputs = {dailyMax:'100',hourlyRate:'30',hoursPerDay:'5',daysPerWeek:'5',lifetimeMax:'10000',hasWaiverOfPremium:false,monthlyPremium:'200',hasInflationRider:false,inflationPercentage:'3'};
describe('real care calculator', () => {
 it('separates family costs and benefit payments', () => {
  expect(calculateCare(input)).toMatchObject({insurancePaysDaily:'100.00',youPayDaily:'50.00',weeksOfCare:20});
 });
 it('waiver saves premiums without extending the pool', () => {
  const value=calculateCare({...input,hasWaiverOfPremium:true})!;
  expect(value.weeksOfCareWithWaiver).toBe(value.weeksOfCare);
  expect(value.netDailyCost).toBe('50.00');
  expect(value.premiumSavingsMonthly).toBe('200.00');
 });
 it.each([{hoursPerDay:'25'},{daysPerWeek:'8'},{hourlyRate:'-3'},{dailyMax:'Infinity'},{lifetimeMax:'0'},{monthlyPremium:'-1'}])('rejects invalid inputs %j', patch => expect(calculateCare({...input,...patch})).toBeNull());
 it('caps withdrawals at benefit limits and keeps family costs after exhaustion', () => {
  const rows=projectCare({...input,lifetimeMax:'100'})!;
  expect(rows[0].insurancePayment).toBe(100);
  expect(rows[1].insurancePayment).toBe(0);
  expect(rows[1].familyCost).toBe(rows[1].monthlyCost);
  expect(rows.every(row=>row.benefitRemaining>=0)).toBe(true);
 });
});
