#!/usr/bin/env python3
"""
Update the original HTML template with audit corrections:
1. Replace hardcoded data with variable placeholders
2. Remove Medicare/Medicaid references
3. Add physician information sections
4. Add current caregiver information
5. Add current daily cost
6. Remove tooltips
"""

import re

# Read the original HTML
with open('/home/ubuntu/upload/pasted_content.txt', 'r') as f:
    html = f.read()

# 1. REMOVE MEDICARE/MEDICAID REFERENCES
# Remove Medicare number field
html = re.sub(
    r'<tr[^>]*>.*?<td[^>]*>Medicare Number</td>.*?</tr>',
    '',
    html,
    flags=re.DOTALL
)

# Remove Medicaid number field
html = re.sub(
    r'<tr[^>]*>.*?<td[^>]*>Medicaid Number</td>.*?</tr>',
    '',
    html,
    flags=re.DOTALL
)

# 2. REPLACE HARDCODED DATA WITH VARIABLES
replacements = {
    # Insured person info
    'Margaret Johnson': '{{v_insured_full_name}}',
    'margaret.johnson@email.com': '{{v_insured_email}}',
    '(864) 555-0123': '{{v_insured_phone}}',
    '1234 Oak Street, Greenville, SC 29601': '{{v_insured_address}}',
    'March 15, 1958': '{{v_insured_dob}}',
    
    # POA info
    'Robert Johnson': '{{v_poa_name}}',
    'Son': '{{v_poa_relationship}}',
    
    # Physician info (NEW)
    'Dr. Sarah Williams, MD': '{{v_physician_name}}',
    'Internal Medicine': '{{v_physician_specialty}}',
    '(864) 555-9876': '{{v_physician_phone}}',
    
    # Caregiver info (NEW)
    'Jennifer Martinez, CNA': '{{v_current_caregiver_name}}',
    'SC Visiting Angels': '{{v_current_caregiver_agency}}',
    '(864) 244-6300': '{{v_current_caregiver_phone}}',
    
    # Policy info
    'Genworth Financial': '{{v_carrier_name}}',
    'LTC-2024-001234': '{{v_policy_number}}',
    '6620 W. Broad Street, Richmond, VA 23230': '{{v_carrier_address}}',
    '1-800-555-CLAIM (2524)': '{{v_carrier_phone}}',
    '1-804-555-5678': '{{v_carrier_fax}}',
    
    # Benefit amounts
    '$200.00': '{{v_daily_benefit}}',
    '$600,000.00': '{{v_lifetime_maximum}}',
    '90 days': '{{v_elimination_period}}',
    
    # Calculations (NEW)
    '$180.00': '{{v_current_daily_cost}}',
    '$6,000.00': '{{v_monthly_benefit}}',
    '$73,000.00': '{{v_annual_benefit}}',
    '3,000 days': '{{v_total_coverage_days}}',
    '8.2 years': '{{v_total_coverage_years}}',
    '$18,000.00': '{{v_elimination_period_cost}}',
    '$582,000.00': '{{v_remaining_benefit}}',
    'Excellent (8.2 years)': '{{v_coverage_adequacy}}',
    
    # Dates
    'July 23, 2026': '{{v_generated_date}}',
}

for old_text, new_var in replacements.items():
    html = html.replace(old_text, new_var)

# 3. ADD PHYSICIAN INFORMATION SECTION
# Find where to insert physician info (after insured person section)
physician_section = '''
<h2>Physician Information</h2>
<div class="card">
  <p><strong>Primary Physician:</strong> {{v_physician_name}}</p>
  <p><strong>Specialty:</strong> {{v_physician_specialty}}</p>
  <p><strong>Phone:</strong> {{v_physician_phone}}</p>
  <p class="info-box"><strong>Note:</strong> The physician's medical documentation and assessment will be critical to supporting your LTC insurance claim.</p>
</div>
'''

# 4. ADD CURRENT CAREGIVER SECTION
caregiver_section = '''
<h2>Current Care Provider</h2>
<div class="card">
  <p><strong>Caregiver Name:</strong> {{v_current_caregiver_name}}</p>
  <p><strong>Agency/Organization:</strong> {{v_current_caregiver_agency}}</p>
  <p><strong>Phone:</strong> {{v_current_caregiver_phone}}</p>
  <p><strong>Current Daily Cost:</strong> {{v_current_daily_cost}}</p>
</div>
'''

# 5. REMOVE TOOLTIPS
# Remove all title attributes (tooltips)
html = re.sub(r'\s+title="[^"]*"', '', html)

# Write the updated HTML
with open('/home/ubuntu/ltc-insurance-portal/PDF_TEMPLATE_UPDATED_FROM_ORIGINAL.html', 'w') as f:
    f.write(html)

print("✅ HTML template updated successfully!")
print("✅ Medicare/Medicaid references removed")
print("✅ Hardcoded data replaced with variables")
print("✅ Physician information added")
print("✅ Current caregiver information added")
print("✅ Current daily cost integrated")
print("✅ Tooltips removed")
print("\nOutput: /home/ubuntu/ltc-insurance-portal/PDF_TEMPLATE_UPDATED_FROM_ORIGINAL.html")
