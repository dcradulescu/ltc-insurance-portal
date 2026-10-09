# TODO continuation — UI/UX preserved

Status: **in progress**. This table records all 39 items open at the beginning of this pass. Seven are completed with evidence; 32 remain open. Across the original 61 open requirements, 29 are now complete. The 670 inherited checks remain historical assertions, not new verification.

The user reiterated “Retain UI/UX and continue.” Colors, typography, layout, existing artwork references and player presentation are retained. Deferred visual requests remain visible in the checklist. Functional repairs, accessibility attributes, accurate error states and two missing downloads use the established components.

Line numbers refer to the original canonical `todo.md` baseline, not a new checklist.

| Baseline line | Requirement | Status | Evidence / remaining gate |
|---|---|---|---|
| 847 | Create visually rich multi-layout PDF with distinct colored sections (teal, blue, green, yellow, pink) | Open — preserve design | Existing PDF layouts retained. Full multi-color brochure acceptance remains outstanding. |
| 848 | Design hero banner sections with background graphics and text overlays | Open — preserve design | No new hero artwork or overlays introduced under the instruction to retain UI/UX. |
| 850 | Create custom graphics, icons, and data visualizations for each section | Open — preserve design | Custom graphics for every PDF section would require a separate visual change; no substitute assets added. |
| 854 | Generate final professional brochure PDF with heavy graphical content | Open — PDF acceptance | Generation works; final graphical brochure and full content/stress-case approval remain outstanding. |
| 861 | Test Home page: all links, CTAs, video player, chat widget | Open — external playback | Navigation, share controls and mocked chat verified. Original video playback and every CTA combination remain unverified. |
| 862 | Test Education page: navigation, accordions, glossary, video | Open — interaction coverage | Deep-linked definitions now open and scroll correctly. Complete accordion/video acceptance remains outstanding. |
| 863 | Test Academy page: video player, timeline, progress tracking, accordions | Open — external playback | Prior lesson completion/timeline checks pass. Third-party playback and all accordion combinations still need acceptance. |
| 864 | Test Policy Form: all 6 steps, validation, tooltips, video icons, save & return | Open — conditional coverage | Eight six-step/restoration scenarios and all 66 saved-field round-trips pass with mocked storage. Full tooltip, conditional-field and live recovery acceptance remain. |
| 865 | Test Strategy page: form completion, PDF download, email delivery, Zapier webhook | Open — live integrations | Generation and real local PDF downloads pass; receiving automation and inbox delivery are unconfigured. |
| 866 | Test Contact page: form submission, email delivery, calendar integration | Open — live integrations | Validation, failure/retry and phone fallback pass; actual inbox receipt and configured booking remain unverified. |
| 868 | Test footer links: Privacy Policy, Terms of Use, all external links | Complete | Footer Terms/Privacy transitions verified at three widths; SC Visiting Angels and Visiting Angels external destinations opened successfully through primary website retrieval. |
| 869 | Test navigation: all page transitions, scroll to top behavior | Complete | Production navigation suite clicks distinct rendered internal destinations on 24 routes at three widths, checks top reset, deep fragments and history behavior. |
| 870 | Test chat widget: on all pages, message sending, response generation | Open — live model | Both widgets work with fixture responses; six suggested prompts, retry and session continuity verified. Live model-provider generation remains unconfigured. |
| 871 | Test mobile responsiveness: all pages on mobile/tablet | Open — visual acceptance | All 24 routes checked at 1440/768/390 with no document overflow. Missing original media, full keyboard and conditional states prevent complete visual acceptance. |
| 872 | Document all issues found in prioritized list | Complete | Prioritized findings and every remaining item are documented in DEVELOPMENT_REVIEW.md and this pass ledger. |
| 875 | Fix any broken navigation links | Complete | Replaced 13 helper placeholder links with matching destinations; supplied missing timeline and sample-form resources. Internal destinations and glossary targets tested. |
| 877 | Fix page flow/navigation issues | Complete | Single navigation scroll owner, real helper destinations and mobile-menu close behavior verified without redesign. |
| 878 | Fix scroll-to-top on page transitions | Complete | Removed competing smooth resets; route changes return to the top, education fragments clear the fixed header, same-path/history fragments reopen the correct definitions. |
| 879 | Fix mobile layout issues | Open — visual acceptance | No document overflow found in tested routes. Full media-loaded layouts and all conditional states remain unverified. |
| 880 | Verify all CTAs work correctly | Open — CTA acceptance | Navigation, sharing, chat and core forms tested. Live delivery/booking, third-party playback and remaining conditional CTA combinations are not certified. |
| 885 | Test email delivery of PDF | Open — inbox receipt | Both strategy-email contracts include genuine PDF bytes under mocked fetch. No inbox receipt tested. |
| 886 | Test email delivery of policy form data | Open — inbox receipt | All policy fields appear in owned handoff payloads. Receiver routing/template/inbox acceptance still required. |
| 887 | Test email delivery of strategy checklist | Open — inbox receipt | Task completion overrides, including false, are included in handoffs. Checklist inbox delivery remains unverified. |
| 888 | Verify email templates render correctly | Open — receiver templates | Templates belong to the receiving automation and are not available in this repository. |
| 891 | Test Zapier webhook on Policy Form submission | Open — receiving automation | All policy trigger payloads and HTTPS failure paths pass with mocked fetch. No configured Zapier acceptance tested. |
| 892 | Test Zapier webhook on Strategy page email delivery | Open — receiving automation | Strategy email and comprehensive strategy handoff contracts pass with mocked fetch. Live receiver remains unconfigured. |
| 893 | Test Zapier webhook on Contact form submission | Open — receiving automation | Contact contract passes with mocked fetch and browser failure/retry checks. Live receiver remains unconfigured. |
| 894 | Verify webhook payloads are correct | Complete | 17 comprehensive/legacy handoff tests and six email-contract tests verify ownership, all trigger mappings, metadata, task progress, draft allowlisting, PDF bytes and trusted resume origin. Receiver acceptance is tracked separately. |
| 898 | Run full end-to-end test: Home → Education → Policy Form → Strategy → Contact | Open — integrated journey | Component journeys pass with fixtures. A complete configured database/model/delivery journey has not run. |
| 899 | Verify all data persistence (localStorage, database) | Open — real database | All 66 fields round-trip through the actual router with mocked persistence; local browser persistence tested. MySQL connection, schema/migration and real create/update/reload acceptance remain. |
| 901 | Verify all animations and micro-interactions work | Open — interaction coverage | Chat, sharing, mobile menu and video-control errors now have focused browser regressions. All animation/focus/reduced-motion states remain unverified. |
| 903 | Deliver final analysis and status report | Open — final delivery | This is an interim development report; unfinished requirements prevent a final completion claim. |
| 917 | Add sample LTC Insurance videos for each section (until user creates custom videos) | Open — video acceptance | Existing Academy sample embeds retained. Actual external playback across all sections remains unverified. |
| 919 | Make Academy look more professional overall | Open — preserve design | Academy visual redesign deferred under the latest instruction to retain UI/UX. |
| 928 | Include pictures in resource sections for relatability | Open — original assets | Existing image references retained. Original external image availability/restoration must be established before acceptance. |
| 929 | Add charts to show process and progress | Open — preserve design | No new charts introduced into the existing resource layout under the instruction to retain UI/UX. |
| 930 | Vary layout per section to keep visually interesting | Open — preserve design | Existing resource section layout retained. The requested visual variation is not silently marked complete. |
| 937 | Replace hero banner video with YouTube video explaining LTC policy | Open — preserve design | Original Policy Form hero player retained. Switching its presentation/provider is outside this preservation pass. |
| 970 | Magazine layout improvements for Education definitions (already implemented with 4-stage accordion layout) | Open — preserve design | Existing four-stage education layout retained; the historical magazine-layout request is not newly certified. |

Primary external destinations checked in this pass: https://www.scvisitingangels.com/ and https://www.visitingangels.com/. The resource reference https://content.naic.org/consumer/long-term-care-insurance.htm was also reachable. These checks do not establish third-party video playback or the availability of every linked external asset.

No live messages, production deployment or main-branch merge were performed.

## Subsequent clarified request

The user subsequently requested an inventory of mocked integrations requiring real production connections. That new request is completed in `PRODUCTION_INTEGRATIONS.md` and `PRODUCTION_INTEGRATIONS.csv`: 37 registered procedures and 39 integration/capability records, including 14 removed/dormant exceptions. This adds one separately completed TODO entry; the original 29-complete/32-open accounting above is unchanged. No UI/UX files were changed by the inventory/backend pass.
