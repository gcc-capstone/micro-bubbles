# COMP 451

# UI Flow Prototype V1

## Goal

Create an interactive prototype that shows the major user flows of your system before production development begins.

This prototype is for:

- customer feedback
- user testing
- evaluating navigation and workflow
- discovering missing screens, information, and controls

This is **not production code**.

## Technology

Use the same general UI technology planned for your project:

- Web applications: React + TypeScript
- Mobile applications: React Native

Place the prototype in:

`ui-prototype/`

Do **not** put it in `frontend/`.

The production frontend will be created later with normal engineering and ownership expectations.

## Prototype Style Baseline

Before the team builds individual screens, I recommend one team member create a small PR that establishes a shared visual starting point for the prototype. This helps keep independently developed screens from looking like parts of different applications.

If your team or customer has an existing icon, logo, website, or other visual material, consider giving it to AI as part of the prompt so the prototype can reflect an appropriate color scheme and style.

### Suggested AI Prompt

> I am creating an initial visual style page using **React + TypeScript**. Keep the implementation simple.
>
> I have attached our team/customer logo. Use it as inspiration for the color palette and overall visual style. Do not simply make every element the same colors as the logo.
>
> Create a single style-reference page that shows:
>
> - primary heading
> - secondary heading
> - body text
> - list item
> - checkbox
> - text input
> - dropdown
> - primary button
> - secondary button
> - card or panel
> - basic navigation/header
>
> Use generic labels such as "My Heading," "My Button," and "My List Item."
>
> Develop a small, consistent visual style, including:
>
> - color palette
> - typography hierarchy
> - spacing
> - buttons
> - form controls
> - cards or panels
> - navigation
>
> Show the main colors as labeled color swatches on the page and also use those colors in the example UI elements.
>
> Do not add unnecessary infrastructure or architecture.

For a React Native team, replace the first line with:

> I am creating an initial visual style screen using **React Native**. Keep the implementation simple.

Teams without an existing logo or other branding can simply omit the logo sentence.

### Using the Style Baseline

When using AI to create additional prototype screens, give it the current style-reference page and the files that define its styling.

For React + TypeScript, this will usually include the relevant `.tsx` component and CSS/style files.

For React Native, include the style-reference screen and any shared `StyleSheet`, theme, or navigation styling used by the prototype.

If your AI tool already has access to the repository, tell it which files contain the style baseline.

Treat these files as the visual source of truth for new prototype screens.



## Prototype Requirements

Your prototype should support the major representative tasks for your initial system.

For each representative task, a user should be able to click or tap through the complete flow.

Use realistic dummy information.

Good:

- `Maya Thompson`
- `AP Environmental Science`
- `Safety Inspection - Pump Station 4`

Avoid:

- `User 1`
- `Course A`
- `Item`
- `Lorem ipsum`

Realistic data helps reveal problems with layout, wording, information density, and navigation.

## Dummy Behavior Is Expected

Do not build production infrastructure for this assignment.

You do **not** need:

- a backend
- a database
- authentication
- APIs
- persistent storage
- production deployment
- production-quality validation

Use hardcoded or in-memory dummy data.

Buttons, forms, and other controls should behave well enough to demonstrate the intended user flow.

For example:

- Login may accept any username and password.
- Saving a form may update local state or simply navigate to the expected next screen.
- Lists may come from hardcoded arrays.
- Different users or roles may be represented by buttons or predefined dummy accounts.

The goal is to test the **design and workflow**, not the implementation architecture.

## Completeness

Version 1.0 does **not** mean partially finished.

The prototype should include the screens and interactions needed to demonstrate the major representative tasks and user roles planned for the initial product.

Someone unfamiliar with the project should be able to understand:

- what information is shown
- what actions are available
- what is clickable
- where each action leads
- how a representative task is completed

## Git and Pull Requests

Continue using branches and pull requests to coordinate team work.

However, this is rapid prototype work.

For this assignment:

- PRs may be larger than normal.
- PR descriptions may be brief.
- Normal production PR documentation requirements do not apply.
- You are not expected to document deployment, rollback, observability, or production risk.

Use Git and PRs mainly so the team can coordinate changes safely.

## AI Use

You are encouraged to use generative AI aggressively for this assignment.

You may use AI to generate:

- React or React Native components
- styling
- dummy data
- navigation
- forms
- screen layouts
- prototype interactions

You are **not expected to understand every implementation detail** of the prototype code.

You **are responsible for the design decisions represented by the prototype**, including:

- what information is displayed
- what controls are available
- how users navigate
- what happens when users interact with the system
- whether the prototype accurately represents the intended product

Production code created later in the course will have substantially higher ownership and engineering expectations.

## Suggested AI Prompt

You may begin AI conversations with something like this:

> I am building a temporary UI prototype for customer feedback and user testing.
>
> This is **not production code**.
>
> Prioritize speed, simplicity, and clear user flow.
>
> Use hardcoded or in-memory dummy data everywhere possible.
>
> Do not add a backend, database, authentication system, API layer, production configuration, complex architecture, or other production infrastructure.
>
> The prototype should be interactive enough that a user can click or tap through realistic workflows.
>
> Keep the implementation simple and easy to modify.
>
> I have provided the existing style-reference page and its styling files. Use these as the visual source of truth for this work.
>
> Match the existing colors, typography, spacing, buttons, form controls, cards, and navigation rather than creating a new visual style.
>
> I will describe one screen or user flow at a time.

### React Native Teams

React Native teams should follow the same prototype requirements, but design for the expected mobile device and use mobile-appropriate navigation, controls, and touch interactions.

You may simulate device capabilities such as location, camera, notifications, or offline behavior.  Do not spend time configuring real device services unless they are necessary to evaluate the user flow.

The prototype should demonstrate what the user experiences, not prove that the underlying mobile infrastructure already works.

For example, if part of your task flow includes taking a picture, just implement the "take photo" button so that tapping the button simply jumpts you to a screen showing a preselected dummy image. 

Similarly, if the real application will use GPS, you may hardcode a sample location and show how that location would appear in the interface. The goal is to let users evaluate what they see and what they do next, not to implement live location tracking yet.

I am also new to React Native development, so we will be learning some of the platform-specific details together.  I can help you reason about the design, architecture, and engineering tradeoffs, and I am happy to work through difficult React Native-specific problems with you as they come up.  You should also expect to do some independent research as we learn the platform.

## After Version 1.0

Keep evidence of meaningful UI changes made after Version 1.0.

For important improvements, record:

- before image
- after image
- what prompted the change

Possible reasons include:

- customer feedback
- user testing
- presentation feedback
- cognitive walkthrough
- team discussion

These changes will be useful later in reports and presentations.



