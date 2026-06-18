# PopEyez Database Structure

The project uses a JSON database file at `backend/database/db.json`. The same structure is generated from `backend/database/seed.json` when running `npm run seed`.

## Collections

## users
Stores organizer, staff, vendor, guest, and venue owner accounts.

Important fields:
- id
- name
- email
- role
- status
- speciality / companyName / suppliesOffered depending on role

## events
Stores pop-up café events.

Important fields:
- id
- name
- type
- date
- time
- status
- venueId
- organizerId
- expectedGuests
- dressCode
- agenda

## venues
Stores venue listings.

Important fields:
- id
- ownerId
- name
- description
- city
- location
- capacity
- dimensions
- amenities
- pricing
- availableDates
- photos
- floorPlans
- status

## bookingRequests
Stores organizer applications to book venues.

Important fields:
- id
- eventId
- venueId
- organizerId
- date
- expectedAttendees
- specialRequirements
- status
- counterProposal

## tasks
Stores guided workflow tasks and staff assignments.

Important fields:
- id
- eventId
- title
- category
- status
- dueDate
- assignedTo
- reminderSent

## budgets
Stores planned totals, planned budget items, and actual expenses.

Important fields:
- eventId
- plannedTotal
- plannedItems[]
- actualExpenses[]

## layouts
Stores digital floor plan elements.

Important fields:
- eventId
- sharedWithSetupTeam
- elements[] with type, x, y

## vendors
Stores vendor business profiles.

Important fields:
- id
- userId
- name
- suppliesOffered
- mainLocation
- pricingList
- contact

## sourcingRequests
Stores supply requests from organizers to vendors.

Important fields:
- id
- eventId
- vendorId
- items
- quantities
- deliveryDate
- eventLocation
- status
- deliveryStatus
- delayNote

## invoices
Stores vendor invoices.

Important fields:
- id
- eventId
- vendorId
- amount
- items
- status
- attachments

## guests
Stores event-specific guests, RSVP data, dietary preferences, and check-in status.

Important fields:
- id
- eventId
- name
- email
- rsvpStatus
- dietaryPreference
- specialRequirements
- invitationSent
- checkedIn
- qrCode

## communications
Stores day-of messages and seen status.

Important fields:
- id
- eventId
- message
- sentAt
- recipients[] with guestId and seen

## feedback
Stores post-event guest feedback.

Important fields:
- id
- eventId
- guestId
- overall
- food
- venue
- organization
- comments

## notifications
Stores simple reminders and notifications.

Important fields:
- id
- userId
- message
- read
