# Draft 1 Requirements

Before submitting Draft 1, verify that your report includes all of the following:

* [ ] Cover page with application name, logo, team members' names, and date
* [ ] Introduction that clearly explains:

  * [ ] the purpose of the system
  * [ ] the target user group or groups
  * [ ] the main features of the system
* [ ] Representative Tasks section with:

  * [ ] introductory text explaining the purpose of the tasks
  * [ ] complete descriptions of the representative tasks
  * [ ] realistic user goals rather than instructions for using a particular interface
  * [ ] enough context and realistic input for a reader to understand each task
* [ ] Related Work section discussing at least four distinct existing software products that are similar in functionality or purpose to the proposed system, or have a similar element
* [ ] For each related product:

  * [ ] the team examined an appropriate source directly
  * [ ] the report explains specific similarities to the proposed system
  * [ ] the report explains specific differences from the proposed system
  * [ ] the comparison connects to the target users or representative tasks
  * [ ] the discussion identifies a meaningful design insight, implication, or rationale
* [ ] Bibliography containing complete citations for every source discussed in Related Work
* [ ] One citation style is used consistently throughout the bibliography
* [ ] The report is self-contained and understandable to someone who has not seen the assignment or attended class
* [ ] Major sections include appropriate introductory or transition text
* [ ] Figures and tables, if used, are numbered, captioned, and referenced in the text
* [ ] The Markdown renders cleanly on GitHub
* [ ] All team members have contributed to the report
* [ ] Substantial AI-assisted revisions have a committed student-written version (with pre-ai commit message) before the AI-assisted revision (with a post-ai commit message)
* [ ] AI-assisted changes were reviewed for accuracy, clarity, and consistency before being merged
* [ ] Claims about products, publications, or other sources were verified from appropriate sources rather than relying on AI-generated descriptions
* [ ] The Draft 1 report has been reviewed through a pull request and merged into main as docs/report.md.



# Report Draft 1

## Senior Project 1 — COMP 451

This draft is the beginning of your team's final project report. You will continue revising and expanding the same report throughout the semester.

The final report will contain the following sections:

1. Cover Page
2. Introduction
3. Representative Tasks
4. Related Work
5. ~~Results from User Testing of UI Version 1.0~~ — Draft 2
6. ~~Improvements from UI Version 1.0 to Version 2.0~~ — Draft 2
7. ~~Results from User Testing of UI Version 2.0~~ — Draft 3
8. ~~Planned Improvements from UI Version 2.0~~ — Draft 3
9. ~~Legal and Ethical Considerations~~ — Final Report
10. Bibliography

**Draft 1 requires Sections 1–4 and the corresponding references in Section 10.**

## Main Goal for This Draft

The main goal of this draft is to demonstrate that your team has carefully thought about and refined the project idea.

In particular, your report should show that you have:

* clearly defined the purpose and intended users of the system;
* identified realistic tasks that the system should help those users accomplish;
* investigated existing software related to your proposed system; and
* begun making well-reasoned design decisions based on your users, their tasks, and the related work you have examined.

The report should not read like a response to an assignment. It should read like a professional project document that could be given to someone who knows nothing about this course or your application.

---

# Section 1: Cover Page

Include:

* the application name;
* the application logo;
* all team members' names; and
* the date.

For this Markdown draft, format this information cleanly at the beginning of the document. Feel free to use AI for assistance for md formatting (and no need for a pre-AI/pos-AI commit for something like formatting)

---

# Section 2: Introduction

Write approximately one or two paragraphs introducing the system.

The introduction should include the following.

### Purpose of the System

Explain what the system is intended to accomplish.

Think of this as the central purpose of your application rather than a detailed list of functionality.

Examples include:

* "Make office hours more efficient."
* "Connect tutors and students."

A reader should quickly understand why the system exists.

### Target Users

Identify the primary user group or user groups for the application.

Be specific enough that the target users help explain the design decisions you will make later.

### Main Features

Describe the major capabilities of the proposed system.

This should expand on the purpose statement without becoming an exhaustive feature list.

For example:

> Students can remotely check whether a professor's office hours are busy, enter a queue for office hours, or schedule an appointment for later. Professors can post changes to their office hours, check student availability when scheduling additional study sessions, and view information about previous visits.

Another example:

> Tutors can post their areas of expertise and availability. Students can browse available tutors and view their ratings, or they can find other students taking the same course and form a study group. Messaging within the application allows tutors and students to communicate without revealing personal contact information.

Your introduction should give the reader enough context to understand the representative tasks and related work that follow.

---

# Section 3: Representative Tasks

State the representative tasks that the system should help users accomplish.

Include the full task descriptions, following the criteria discussed in class for strong representative tasks.

Representative tasks should describe realistic **user goals**, not instructions for operating your proposed interface.

Include enough context and realistic information or input that another person can understand what the user is trying to accomplish without already knowing how your interface will work.

For example, a weak task might say:

> A student clicks Find Tutor, selects a course, and presses Search.

This describes one possible interface rather than the user's actual goal.

A stronger task would be:

> A student who is struggling with recursion in COMP 220 wants to find a tutor who has previously taken the course and is available Tuesday evening.

The second description provides enough context to design and evaluate multiple possible interfaces.

For representative tasks that you currently expect to support in the minimum viable product, prefix the task with **MVP:**.

This is a tentative designation and may change as the project scope is refined.
eg:
>**MVP:** A student who is struggling with recursion in COMP 220 wants to find a tutor who has previously taken the course and is available Tuesday evening.




---

# Section 4: Related Work

Throughout the semester, your team will research existing work related to your project.

By the final report, your bibliography must contain at least **15 relevant references**.

Among those references, include at least:

* eight distinct existing software products:

  * at least four that are similar in functionality or purpose to your proposed project;
  * at least four that contain UI elements or interaction patterns relevant to your proposed interface;
* four scholarly articles from computer science or another relevant discipline, or relevant patents.

The remaining references may come from either of these categories or from other credible sources that meaningfully inform the project.

## Expectations for Related Work

For each reference discussed in the Related Work section, explain specifically how it relates to the software or interface you plan to build.

Do not simply summarize the existing product or publication.

Your discussion should explain:

* what is relevant about the existing work;
* what will be similar in your system;
* what will be different;
* why those similarities or differences make sense for your target users and representative tasks; and
* when appropriate, what design decision or insight your team gained from examining the related work.

Specific comparisons are important because they demonstrate that your team has investigated the design space and made intentional decisions about what you are building.

For projects intended for a general marketplace rather than a specific client, your discussion should identify meaningful ways in which your proposed system differs from existing products and explain why those differences are appropriate for your target users and representative tasks.

Do not make unsupported claims that your application will simply be "better," "easier," or "more user friendly."

## Example

Weak example:

> MobileSheets [1] is similar to the music organizer we plan to build for this project. Both applications help users import PDFs of sheet music and organize them on their phone or tablet. MobileSheets lets users create annotations and set lists, which we also plan to do. MobileSheets will provide inspiration for our design.

Stronger example:

> MobileSheets [1] is similar to the music organizer we plan to build for this project. Both applications help users import PDFs of sheet music and organize them on a phone or tablet while supporting annotations and set lists. MobileSheets also supports Bluetooth page turners, two-tablet viewing, and integration with cloud providers such as OneDrive and Google Drive. These capabilities are less important for our target audience's primary tasks and are not currently part of our proposed system. Instead, distributing music to an entire band is an important task for our users. Our application will therefore allow a band leader to distribute a set list to selected members of the band.

## Research Expectations

For every product, article, patent, or other source discussed in the report, your team must examine the cited source yourselves.

AI-generated descriptions of products, research papers, or patents are **not sources**.

AI may help you identify products, terminology, search terms, papers, or other material that may be worth investigating. However, important claims must be verified using appropriate sources.

For software products, use first-hand information when practical, such as:

* the product itself;
* a demonstration or trial;
* official documentation;
* official screenshots or videos; or
* other reliable primary material.

Do not base a comparison entirely on an AI summary, search-result snippet, or another person's short description of the product.

## Requirements for Draft 1

For Report Draft 1, the Related Work section must discuss at least **four distinct existing software products that are similar in functionality or purpose to your proposed project**.

For each product, include a specific comparison of the product with your proposed system.

---

# Section 10: Bibliography

Include full citations for every reference used in the Related Work section.

You may use any standard citation format, but choose one format and use it consistently throughout the report.

Acceptable examples include:

* ACM
* IEEE
* APA

Examples and formatting guidance:

* ACM: https://www.acm.org/publications/authors/reference-formatting
* IEEE: https://pitt.libguides.com/citationhelp/ieee
* APA: https://pitt.libguides.com/citationhelp/APA

A URL by itself is not a complete citation.

---

# General Writing Instructions

## Write a Self-Contained Report

Your report must make sense to a reader who has basic software or UI experience but:

* has no previous knowledge of your application;
* has not attended our class;
* has not seen your presentations; and
* has not read this assignment.

Do not rely on phrases such as:

> As discussed in class...

or:

> For this assignment, we were asked to...

The report should explain the project directly.

## Introduce Sections

Use transition text to introduce major sections.

For example, the Representative Tasks section should not begin immediately with a list of tasks.

Instead, introduce why the tasks matter and how they relate to the system.

## Write as One Team

There will be one report per team.

All team members should contribute to the report.

However, the team can designate an editor who is responsible for making the final document read as one coherent voice rather than several unrelated pieces written by different people.

Team members remain responsible for understanding the sections they contribute.

## Write Professionally

The document should be professional in organization, appearance, and tone.

Use:

* clear section headings;
* appropriate Markdown formatting;
* readable paragraphs;
* appropriate lists when useful;
* properly displayed figures and tables; and
* consistent terminology throughout the document.

The Markdown document should render cleanly on GitHub.

## Figures and Tables

Number and caption all figures and tables.

Figure captions should appear below figures.

Table captions should appear above tables.

Every figure and table appearing in the document must also be referenced in the surrounding text.

For example:

> Table 1 summarizes the results from testing the two candidate UI designs.

or:

> Most participants completed the task successfully, although one participant had difficulty locating the scheduling option (Table 1).

Do not insert figures or tables without explaining why they matter.

## Grammar and Technical Writing

Use proper grammar, spelling, and punctuation throughout the document.

Writing should be clear, concise, and precise.

Avoid unnecessary repetition, vague statements, unsupported claims, and excessive verbosity.

Prefer sentences that make responsibility and action clear. Passive voice is acceptable when the actor is unimportant or already understood, but do not use passive constructions merely to make writing sound more formal.

Avoid informal idioms and overly conversational language.

Do not use contractions in the report. For example, use `do not` rather than `don't`.

In ordinary prose, spell out whole numbers zero through nine. Use numerals for measurements, percentages, versions, dates, technical values, figure and table references, and other contexts where numerals improve clarity.

Use verb tense intentionally:

* use present tense to describe the current system, existing products, and established facts;
* use past tense for work or testing that has already occurred;
* use future tense for genuinely planned work.

Consistency within a passage is more important than forcing the entire report into one tense.

When questions of style arise, prefer clear, concise technical writing and consistency within the report. Course-specific requirements in this assignment take precedence over general style conventions.

---

# AI Use

You may use generative AI as a writing and review tool for this report.

You remain responsible for the:

* ideas;
* research;
* comparisons;
* design decisions;
* factual claims;
* citations; and
* final wording

that appear in the document.

## Preserve Your Original Work

**Before asking AI to substantially revise text that you have written, commit your own draft to your branch.**

The draft may be rough and use sloppy wording - you dont need to spend time polishing your draft.

After using AI, carefully review the resulting changes and **commit the revised version separately.**

Your Git history should make it possible to see the text before and after substantial AI assistance.

The purpose of this requirement is not to prevent AI use. It is to preserve authorship, make changes reviewable, and ensure that the team retains ownership of the report.

## Keep AI-Assisted Changes Reviewable

Use AI on one section or another reasonably sized portion of the report at a time.

Do not ask AI to rewrite the entire report or make large changes across several sections at once.

Large AI-generated edits are difficult for teammates to review and may require the rest of the team to spend more time checking the changes than the person making them spent producing them.

Large, multi-section AI-generated changes may receive a grading penalty.

## Appropriate AI Uses

Appropriate uses include:

* improving clarity, concision, grammar, or organization of text you have written;
* critiquing a section and identifying ideas that need more explanation;
* identifying ambiguous or unsupported statements;
* suggesting questions that a section should answer;
* suggesting search terms or categories of related products or literature to investigate;
* helping you identify possible weaknesses in an argument or comparison.
* formatting md
* creating bibliography entry according to specifications

AI must not substitute for your team's research, analysis, or design decisions.

In particular, do not rely on AI-generated descriptions of:

* software products;
* scholarly articles;
* patents;
* user needs;
* user-testing results; or
* sources and citations

without independently verifying them from appropriate sources.

Every team member must be able to explain and defend the material they contribute.

AI assistance is acceptable. Unreviewed or unexplained authorship is not.

---

# Feedback and Revision

You should expect corrections and substantial revisions to your draft.

This is normal.

Technical reports generally improve through multiple rounds of writing, review, and revision.

Draft grades may therefore be lower than grades students are accustomed to receiving on assignments where the submitted work is treated as final.

The primary purpose of grading these drafts is formative: the feedback should help your team substantially improve the final report.

However, a meaningful review is only possible when the submitted draft is already a serious attempt at a professional document.

For this reason, report drafts are a non-trivial part of the course grade even though the final report is worth more.

---

# File and Git Workflow

Maintain the report as:

`docs/report.md`

The same report will evolve throughout the semester.

Do not create separate files such as:

* `report-draft1.md`
* `report-draft2.md`
* `report-final.md`
* `report-final-final.md`

Git history provides the version history of the document.

Your repository history should make it possible to identify the state of the report submitted for each draft.

Make report changes through your team's normal branch and pull-request workflow.

Keep commits and pull requests reasonably focused and reviewable.

---

# Grading Rubric

The report receives two scores:

* **Quality Score**
* **Content Score**

Each score is calculated on a 100-point scale.

The final score is the geometric mean of the two scores:

**Final Score = √(Quality Score × Content Score)**

This means that strong writing cannot compensate completely for missing content, and complete content cannot compensate completely for a report that is difficult to read.

---

# Quality Score — 100 Points

## Writing Quality — 80 Points

The report will be evaluated for:

* proper spelling and grammar;
* clear and concise writing;
* logical organization;
* appropriate technical-writing style;
* absence of confusing, tangential, vague, or superficial information;
* consistent terminology;
* appropriate transitions between ideas and sections; and
* self-contained explanations understandable to a reader with no knowledge of the assignment or application.

### Excellent — 80 points

Writing has very few errors, unclear points, or unnecessary passages. Problems do not noticeably interfere with reading or understanding the report.

### Good — 68 points

Writing is generally grammatically correct, clear, concise, and well organized. Occasional problems are present but do not significantly distract the reader.

### Fair — 44 points

Problems with grammar, clarity, organization, or verbosity sometimes impede the narrative or distract the reader. However, most of the report remains understandable.

### Poor — 20 points

Problems with grammar, clarity, organization, or verbosity frequently make the report difficult to follow.

### Failure — 0 points

Problems with grammar, clarity, organization, or verbosity make most of the report difficult to understand.

## Document Appearance and Details — 20 Points

* Professional organization and appearance — 10 points
* Figures and tables are numbered, captioned, and referenced appropriately in the text — 7 points
* Consistent and appropriate Markdown formatting — 3 points

Additional formatting or appearance problems may reduce the score as appropriate.

---

# Content Score — 100 Points

## Cover Page — 3 Points

* Application name
* Logo
* Date
* Team members' names

## Introduction — 15 Points

### Purpose — 3 Points

Clearly communicates why the system exists and what problem or need it addresses.

### Target Users — 3 Points

Clearly identifies the intended user group or groups.

### Main Features — 9 Points

Explains the major capabilities of the proposed system with enough detail for the reader to understand its scope without becoming an exhaustive feature list.

## Representative Tasks — 47 Points

### Introductory Text — 2 Points

Introduces the purpose of the representative tasks and connects them to the project.

### Representative Tasks — 45 Points

Tasks are:

* realistic;
* specific;
* representative of important user goals;
* described with appropriate context and realistic input;
* independent of a predetermined UI solution; and
* useful for guiding and evaluating the design of the system.

## Related Work — 28 Points

Discusses at least four distinct existing software products that are similar in functionality or purpose to the proposed project.

The discussion should demonstrate:

* accurate understanding of the existing product;
* specific similarities to the proposed system;
* specific differences from the proposed system;
* connections to the target users or representative tasks; and
* meaningful design insights, implications, or rationale resulting from the comparison.

Simply describing four products is not sufficient.

## Bibliography — 7 Points

Citations are:

* complete;
* properly formatted;
* consistent in style;
* matched to the references discussed in the report; and
* based on sources the team actually examined.
