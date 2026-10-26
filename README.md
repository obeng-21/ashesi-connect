# Ashesi Connect

A proposed student communications app for Ashesi University, starting with university notices, message acknowledgements, and SMS follow-up.

## Project status

Planning stage. This is an independent prototype intended for presentation to Ashesi University. It is not currently an official university app, endorsed service, or connected to university systems. No application code or live messaging integrations have been implemented yet.

## Problem to explore

Students may miss university emails, while staff need a practical way to follow up. The prototype will demonstrate how notices, explicit acknowledgements, and limited SMS reminders could support student communications.

## First prototype

### Student experience

- View a notice feed and notice details.
- Explicitly acknowledge a notice.
- Review acknowledgement history.
- Manage notification preferences.

### Staff experience

- Create notices and select recipient groups.
- View acknowledged and not-yet-acknowledged recipients.
- Configure a reminder delay and reminder limit.
- View email and SMS delivery status separately from acknowledgement status.

### Demonstration flow

1. Staff create a notice for fictional students.
2. The system records each recipient and displays a simulated email delivery.
3. A student acknowledges the notice in the app or through a recipient-specific email link.
4. After the configured delay, the reminder worker checks for outstanding acknowledgements.
5. Eligible recipients receive a simulated SMS reminder; acknowledged recipients are skipped.
6. Staff review acknowledgement and delivery results.

Email opens do not prove that a message was read. The system records explicit acknowledgement rather than claiming to detect reading. Email-link acknowledgement should require a deliberate confirmation action, not merely opening the link, so automated link scanners do not acknowledge notices.

## Prototype boundaries

- Use fictional student records and simulated email/SMS delivery by default.
- Any real delivery testing uses explicitly agreed test recipients.
- Do not commit credentials, student records, phone numbers, or private university messages.
- University login, directory access, email integration, and use of real student information require university agreement.
- This first version covers notices created through the prototype; monitoring existing university mail is a separate integration decision.

## Acceptance criteria

- Acknowledgement updates only the intended notice and recipient.
- Acknowledging a notice cancels pending reminders for that recipient.
- Retrying a job does not send duplicate reminders.
- Reminder limits and notification preferences are respected.
- Failed delivery is visible and is not counted as acknowledgement.
- Staff access is limited to authorised recipient groups.
- Recipient links cannot be used to browse other students' information.

## Development roadmap

1. Validate the communications workflow with the contact who suggested the project.
2. Sketch student notice screens and the staff dashboard.
3. Choose a technology stack and scaffold the app, API, database, and background worker.
4. Implement the complete demonstration flow using fictional data and simulated delivery.
5. Verify access control, acknowledgement behaviour, and reminder cancellation/deduplication.
6. Present the prototype and agree on pilot scope, integrations, ownership, and costs.

## Decisions still needed

- Mobile app, responsive web app, or both.
- University email provider and supported integration options.
- Who can publish notices and which groups they can contact.
- Reminder timing, limits, and SMS budget.
- Authentication, data access, retention, and pilot approval requirements.

## Local setup

There is no runnable application yet. Setup instructions will be added when the implementation is scaffolded.
