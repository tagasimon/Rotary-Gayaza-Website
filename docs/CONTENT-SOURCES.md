# Content sources & verification status

Research was done on **2 October 2026**. The seed (`prisma/seed.ts`) contains only what is listed here. **Verified** means it can be traced to a public source. **Club record** means it was supplied by the club administrator and is shown as "Club records" until someone confirms it; these appear on the admin dashboard under *Facts awaiting confirmation*.

## Verified against public sources

| Fact | Source |
|---|---|
| Club name, Club ID 223384, District 9213 | [District 9213 club profile](https://rotaryd9213.org/ClubInfo/gayaza) |
| Meets Sundays, 5:00 PM, Eriot Recreation Centre Gayaza, off Gayaza–Kalagi Road opposite the Coca-Cola depot | District 9213 club profile and [directory](https://rotaryd9213.org/clubdirectory) |
| Map pin 0.4505711, 32.611057 | Google Maps link in the District 9213 directory |
| Club email info@rotarygayaza.org | District 9213 directory |
| Chartered **16 December 2021** | The club's own backdrop ("Club ID 223384 chartered on 16th December 2021 · we meet every Sunday 5:00–6:00 PM"), photographed in the [District 9213 July 2025 album](https://rotaryd9213.org/PhotoAlbums/dg-geoffrey-visits-rc-gayaza) |
| President **Noah Ntensibe**, and the 2026-27 board: Dan Kiguli (VP / Club Foundation Chair), Diana Seera (Secretary), Chealcious Scarlet Angom (Treasurer), Kevin Namata (Sergeant-at-Arms), Judith Amwiine Humura (Exec. Secretary/Director), Frank Ndugga (Service Projects), Juliet Nakayenga (Young Leaders), Stephen Sango (Learning Facilitator), Ernest Mwebesa (Public Relations) | District 9213 club profile. The page shows no Rotary year, so 2026-27 is assumed |
| District Governor 2026-27 **Gerald Obai** | [rotaryd9213.org](https://rotaryd9213.org/) |
| DG visit **11 October 2026, 3:00 PM, Eriot Recreational Centre** | [District 9213 event](https://rotaryd9213.org/event/dgs-visit-to-rc-gayaza/) |
| DG **Geoffrey**'s visit, 27 July 2025 (surname not on the page) | [District 9213 story](https://rotaryd9213.org/Stories/dg-geoffrey-visits-rc-gayaza) |
| **600+** community members mobilised through health outreach; **24+** bodaboda riders trained in road safety and financial literacy (reported July 2025) | Same story |
| 60 photographs of the July 2025 visit (used across the site, credited to District 9213) | Same album |
| Club took part in the **2022 Rotary Cancer Run** | [New Vision, 4 Sep 2022](https://www.newvision.co.ug/category/news/rotary-club-of-gayaza-joins-thousands-in-figh-142481) |

## Added 3 October 2026

* **Mothered by RC Gayaza** (club records): Rotaract Clubs of Gayaza, Gayaza Football, Manyangwa Football and Bugema.
* **Sponsors** (club records): Peoples Medical Hospital, St Mark's Schools Kayunga, St. Eliza Pharmacy & Diagnostic Center (Gayaza), Niyo Garage.
* **Media**:
  * [Bukedde, 29 Sep 2026](https://www.bukedde.co.ug/amawulire/BUK_162097_092026/asiimye-bannalotale-ye-gayaza-okuyambako-gavt) — the New Vision short link redirects to this same article. It is also the source for the **Kaddongo** water project (9 taps at the school, 2 for the village, 10,000-litre tank, Kasthew Construction Ltd, completion expected October 2026) and the earlier **Kiwenda / Springfield Junior School** water project.
  * [Top TV Uganda video](https://www.youtube.com/watch?v=1OuH4yiCUI0), "Agookya okulwanyisa obubenje mu ggwanga".
  * New Vision, 4 Sep 2022, "Rotary Club of Gayaza joins thousands in fight against cancer".
* **Event:** "Sustaining the Engine of Impact", Sunday 4 Oct 2026, 4:00 PM, Eriot Recreation Centre, from the club's flyer and invitation. Speaker: PDG Ken Wycliffe Mugisha.
* **Club list** for the guest dropdown: `src/data/clubs.json`, extracted from the club's Rotary and Rotaract club list (Districts 9213 and 9214, duplicates removed), plus Rotaract Clubs of Bugema and Pere Cadet, which the club named but the list didn't include.

## Club records awaiting confirmation

* Formal meetings began **June 2021**
* Founding support from the **Rotary Club of Kasangati** and the **Rotary Club of Kisaasi-Kyanja** (recorded as *Supported*; change to *Mother club* or *Sponsored* if that is the formal relationship)
* **35** charter members
* **29 Aug 2021:** COVID-19 household support in Mundazabazzadde and Nakwero A
* **5 Feb 2022:** charter celebration · **29 May 2022:** first installation
* Supported the chartering of the **Interact Club of Gayaza Church of Uganda**, the **Interact Club of St Mary's High School Mawule** and the **Rotaract Club of Gayaza Technical School** (years unknown)
* "**9** service projects in a documented Rotary year". Seeded as a **draft** because the year is unknown

## Open questions for the club

1. **Noah Ntensibe and Noah Nyabwana.** The July 2025 district story was posted by "Noah Nyabwana", while the club profile lists the president as "Noah Ntensibe". Are they the same person?
2. **DG Geoffrey's full name** for the archive.
3. **Rotaract Club of Gayaza** (community-based, district club no. 8826239, President Mukasa Joseph). Did RC Gayaza sponsor it? This is in the inbox.
4. **"Gayaza Technical IBC"** on Rotary-O. Is it the same club as the Rotaract Club of Gayaza Technical School? This is in the inbox.
5. **"Gayaza Football"** (Rotaract?) on Rotary-O. What is its relationship to the club? This is in the inbox.
6. **Projects visible in the July 2025 photographs but not yet documented:** an End Polio Now cyclist sculpture, tree planting, a water tank, a borehole/water-point opening, student certificates (Interact?), and a cheque to The Rotary Foundation (Polio Plus & Annual Fund). Write each up from club records. This is in the inbox.
7. **Past presidents 2021-22 to 2025-26** for the leadership timeline.
8. **The official club logo** file from Rotary Brand Center.

## Sources that could not be read

* **rotarygayaza.org** returned HTTP 503 on every page, including the *Mabati Times* bulletin PDF and the WordPress API. Search results show pages titled *World Polio Day*, *Church of Uganda Gayaza Kadongo Primary School*, *St Lillian Correction Center*, *Home hospitality* and *The rise of Rotary Club of Gayaza*. Recover them from the club's own files and add them as stories or projects.
* **x.com/Rcgayaza** can't be read without the paid API. Use *Import from source* for individual posts.
* The **New Vision** article body is paywalled after the first paragraph.
