# Physician Letter Template - For Dynamic Generation

## Header Section
```
[PHYSICIAN NAME, CREDENTIALS]
[MEDICAL PRACTICE NAME]
[STREET ADDRESS]
[CITY, STATE ZIP]
Phone: [PHONE NUMBER]
Fax: [FAX NUMBER]

Date: [DATE]

Re: [PATIENT FULL NAME]
DOB: [DATE OF BIRTH]
```

## Opening
```
To Whom It May Concern:

I am the treating physician for the above-referenced patient and have evaluated this patient as part of ongoing medical care, including the most recent visit on [DATE OF LAST VISIT].
```

## Diagnosis Section
```
In my professional medical opinion, the patient has a chronic, ongoing medical condition diagnosed as [DIAGNOSIS], resulting in persistent cognitive and/or functional impairment. These impairments are expected to persist indefinitely and are not temporary in nature.
```

## Care Requirements Section
```
As a result of this condition, the patient requires either substantial supervision due to severe cognitive decline and associated safety risks, and/or caregiver assistance with two or more Activities of Daily Living. The patient currently requires assistance with the following:

[CHECKBOXES FOR SELECTED ADLs:]
☐ Bathing                          ☐ Dressing
☐ Toileting                        ☐ Transferring
☐ Continence / Incontinence Care   ☐ Eating / Feeding
```

## Cognitive Supervision Section (if applicable)
```
If applicable, the patient also requires substantial supervision due to cognitive impairment, including risk of:

☐ Wandering                                    ☐ Personal injury due to impaired judgment or disorientation
☐ Falls                                        ☐ Inability to respond appropriately in an emergency
☐ Medication mismanagement                    ☐ Other: [SPECIFY]
```

## Medical Necessity Section
```
Based upon the patient's diagnosis, clinical condition, and resulting limitations, care and supervision are medically necessary and may be required up to 24 hours per day for the patient's health, safety, and daily functioning. Without appropriate caregiver assistance and supervision, the patient is at significant risk for injury, decline in personal care, medical complications, and other adverse outcomes.
```

## Recommendation Section
```
It is my professional medical opinion that the patient has a chronic, ongoing need for long-term care services that is expected to persist indefinitely. Accordingly, I recommend approval of long-term care insurance benefits and immediate caregiver support consistent with the patient's diagnosis, level of impairment, and ongoing need for assistance and supervision. Please contact my office if additional documentation is needed.
```

## Closing
```
Sincerely,

[PHYSICIAN NAME, CREDENTIALS]

Signature: _________________________

Date: _____________________________
```

---

## Dynamic Generation Variables

### Required Fields (from Policy Form)
- `insuredFullName` - Patient's full name
- `insuredDob` - Patient's date of birth
- `primaryDiagnosis` - Primary diagnosis (e.g., "Stroke", "Dementia", "Parkinson's")
- `qualifyingAdls` - Array of selected ADLs (e.g., ["Bathing", "Dressing", "Transferring"])
- `cognitiveImpairmentTrigger` - Whether cognitive impairment is a trigger (yes/no)
- `minAdlsRequired` - Minimum ADLs required by policy

### Optional Fields (from Medical Provider Info)
- `primaryCarePhysician` - Name and credentials
- `physicianPractice` - Practice name
- `physicianAddress` - Street address
- `physicianCityStateZip` - City, state, zip
- `physicianPhone` - Phone number
- `physicianFax` - Fax number
- `lastVisitDate` - Date of last visit

### Dynamic Content Rules

1. **Diagnosis Section:** Use `primaryDiagnosis` value
2. **ADL Checkboxes:** Check only the ADLs in `qualifyingAdls` array
3. **Cognitive Supervision:** Only include this section if `cognitiveImpairmentTrigger === "yes"`
4. **Care Hours:** Can reference policy's `dailyMaximum` or use generic "up to 24 hours per day"
5. **Dates:** Use current date for letter date, use `lastVisitDate` if available

### Example Generated Letter

For a patient with:
- Name: John Smith
- DOB: 01/15/1950
- Diagnosis: Stroke with cognitive decline
- Qualifying ADLs: Bathing, Dressing, Transferring
- Cognitive Impairment: Yes
- Min ADLs: 2

The generated letter would:
- Check: Bathing, Dressing, Transferring
- Include cognitive supervision section with risks of falls, wandering, medication mismanagement
- Reference stroke diagnosis and cognitive decline
- Recommend approval for 24-hour care services

---

## Implementation Notes

1. Generate as downloadable PDF
2. Include placeholder text for physician to fill in (e.g., [PHYSICIAN NAME, CREDENTIALS])
3. Provide option to email to physician or print for in-person delivery
4. Include instructions for physician to place in patient's medical record
5. Suggest physician review and modify as needed before signing
6. Emphasize importance of physician signature for claim approval
