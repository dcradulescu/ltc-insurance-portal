import {describe,it,expect} from 'vitest';
import {hydratePolicyMetadata} from '../shared/policyMetadata';
describe('extended policy data round-trip',()=>{
 it('restores extended answers without accepting owner or ID overrides',()=>{
  const p=hydratePolicyMetadata({id:42,userId:7,equipmentAllowance:JSON.stringify({id:99,userId:99,careNeeds:['Bathing'],poa_name:'Jane',inflationAdjustmentEnabled:true,inflationPercentagePerYear:'3'})});
  expect(p).toMatchObject({id:42,userId:7,careNeeds:['Bathing'],poa_name:'Jane',inflationAdjustmentEnabled:true,inflationPercentagePerYear:'3'});
 });
 it('ignores malformed or wrongly typed metadata',()=>{
  expect(hydratePolicyMetadata({equipmentAllowance:'broken',id:7})).toMatchObject({id:7});
  expect(hydratePolicyMetadata({equipmentAllowance:JSON.stringify({careNeeds:'Bathing',poa_name:3,inflationAdjustmentEnabled:'true'})})).not.toHaveProperty('careNeeds');
 });
});
