# Milestone 1 

By Sydney Goettel, Ina Tang, Tim Shin, and Sam Mayfield

---

By the end of the calendar year our team will have built an alpha version of Bubbles in which a user can:

Create a Bubble and QR code for that Bubble from an admin page on their computer, scan a QR code to join a Bubble from their phone, and leave that Bubble from their phone. 

Additionally, our team will put in work to understand the Location API from Smith Micro, as well as any endpoints for the database provider and server application so that the app can have basic functionality, as well as preparing the ground for future changes.

We have 4 main areas to complete in order to make that a reality:

1. Ina - Mobile App
2. Sam - Database Schema
3. Syd - Web Admin Interface and Users and Bubbles classes in TypeScript
4. Tim - DevOps and Executable

The mobile app (for Android) work from Ina will involve bringing our UI mockup to life using React Native. Only the Bubbles mobile app main screen, the QR code scanner, the Bubble-specific homepage, and the leave Bubbles functionality of the UI will need to be created.

The database schema from Sam will involve taking the current ER diagram and creating working tables in a cloud database provider, and providing endpoints for the team and app to access. Neon is our cloud database provider of choice.

The web admin interface and TypeScript classes from Sydney will involve creating a webpage for admins to create and delete Bubbles and QR codes for users to scan. This will be built in React, with possible Java usage if we need a backend. The TypeScript classes will be built in tandem with Ina Tang's development of the mobile app.

The DevOps and executable work from Tim will involve setting up Cloudflare GitHub actions, general GitHub administration, various DevOps needs, and producing an executable of the mobile app that can be run on an Android phone.
