# Assumptions

1. The application is a local demo application, so authentication is simulated through the role switcher in the sidebar.
2. The selected event dropdown is used to demonstrate event-specific workflows without requiring a complete login/session system.
3. A local JSON file is used as the database to make the project easy to install and run locally. It still stores and retrieves data through the Node.js backend.
4. Photos, floor plans, invoice attachments, and QR codes are represented as filenames or text codes instead of uploaded binary files.
5. The venue layout export is implemented as a JSON export. The user can print the browser page to PDF if a PDF copy is required.
6. Email and messaging delivery are simulated by marking invitations and communications as sent in the database.
7. Payment processing is not implemented. Invoice status can be tracked as Pending Review, Approved, or Paid.
8. The app focuses on the main user journey actions required for Milestone 2 rather than advanced production features.
