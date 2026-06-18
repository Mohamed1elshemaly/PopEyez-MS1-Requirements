const express = require('express');
const cors = require('cors');
const {
  readDB,
  writeDB,
  resetDB,
  generateId,
  findById,
  upsertById,
  removeById
} = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function notFound(res, message = 'Record not found') {
  return res.status(404).json({ error: message });
}

function normalize(text) {
  return String(text || '').trim().toLowerCase();
}

function includesSearch(value, search) {
  return normalize(value).includes(normalize(search));
}

function getBudgetSummary(budget) {
  if (!budget) return null;
  const plannedItemsTotal = budget.plannedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const actualTotal = budget.actualExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return {
    ...budget,
    plannedItemsTotal,
    actualTotal,
    remainingAgainstPlannedTotal: Number(budget.plannedTotal || 0) - actualTotal,
    varianceAgainstPlannedItems: plannedItemsTotal - actualTotal
  };
}

function buildReport(db, eventId) {
  const event = findById(db.events, eventId);
  if (!event) return null;

  const guests = db.guests.filter((guest) => guest.eventId === eventId);
  const feedback = db.feedback.filter((item) => item.eventId === eventId);
  const budget = getBudgetSummary(db.budgets.find((item) => item.eventId === eventId));
  const tasks = db.tasks.filter((task) => task.eventId === eventId);
  const vendorRequests = db.sourcingRequests.filter((request) => request.eventId === eventId);

  const average = (items, field) => {
    if (!items.length) return 0;
    const sum = items.reduce((total, item) => total + Number(item[field] || 0), 0);
    return Number((sum / items.length).toFixed(2));
  };

  return {
    event,
    costs: budget,
    attendance: {
      invited: guests.length,
      attending: guests.filter((guest) => guest.rsvpStatus === 'Attending').length,
      maybe: guests.filter((guest) => guest.rsvpStatus === 'Maybe').length,
      notAttending: guests.filter((guest) => guest.rsvpStatus === 'Not Attending').length,
      checkedIn: guests.filter((guest) => guest.checkedIn).length
    },
    taskProgress: {
      total: tasks.length,
      done: tasks.filter((task) => task.status === 'Done').length,
      pending: tasks.filter((task) => task.status === 'Pending').length,
      inProgress: tasks.filter((task) => task.status === 'In Progress').length
    },
    vendorProgress: {
      totalRequests: vendorRequests.length,
      accepted: vendorRequests.filter((request) => request.status === 'Accepted').length,
      delivered: vendorRequests.filter((request) => request.deliveryStatus === 'Delivered').length
    },
    feedbackSummary: {
      responses: feedback.length,
      overallAverage: average(feedback, 'overall'),
      foodAverage: average(feedback, 'food'),
      venueAverage: average(feedback, 'venue'),
      organizationAverage: average(feedback, 'organization'),
      comments: feedback.map((item) => item.comments)
    }
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'PopEyez API', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const db = readDB();
  const { email, password } = req.body;

  if (!email || !password) {
    return badRequest(res, 'Email and password are required.');
  }

  const user = db.users.find((item) => normalize(item.email) === normalize(email));
  if (!user || password !== 'demo123') {
    return res.status(401).json({ error: 'Invalid demo credentials. Use password demo123.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'This account is deactivated.' });
  }

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
});

app.post('/api/seed/reset', (req, res) => {
  const db = resetDB();
  res.json({ message: 'Database reset from seed data', totals: Object.fromEntries(Object.entries(db).map(([key, value]) => [key, Array.isArray(value) ? value.length : 1])) });
});

app.get('/api/bootstrap', (req, res) => {
  const db = readDB();
  res.json(db);
});

app.get('/api/dashboard', (req, res) => {
  const db = readDB();
  const eventId = req.query.eventId || db.events[0]?.id;
  const event = findById(db.events, eventId) || db.events[0];
  const eventGuests = db.guests.filter((guest) => guest.eventId === event.id);
  const eventTasks = db.tasks.filter((task) => task.eventId === event.id);
  const eventFeedback = db.feedback.filter((item) => item.eventId === event.id);
  const eventRequests = db.sourcingRequests.filter((request) => request.eventId === event.id);
  const budget = getBudgetSummary(db.budgets.find((item) => item.eventId === event.id));

  const feedbackAverage = eventFeedback.length
    ? Number((eventFeedback.reduce((sum, item) => sum + Number(item.overall || 0), 0) / eventFeedback.length).toFixed(2))
    : event.positiveFeedbackAverage;

  res.json({
    selectedEvent: event,
    events: db.events,
    totals: {
      upcomingEvents: db.events.filter((item) => new Date(item.date) >= new Date('2026-06-01')).length,
      totalGuests: eventGuests.length,
      arrivedGuests: eventGuests.filter((guest) => guest.checkedIn).length,
      pendingTasks: eventTasks.filter((task) => task.status !== 'Done').length,
      vendorArrivals: eventRequests.filter((request) => request.deliveryStatus === 'Delivered').length,
      plannedBudget: budget?.plannedTotal || 0,
      actualExpenses: budget?.actualTotal || 0,
      feedbackAverage
    },
    upcomingEvents: db.events.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5),
    dueTasks: eventTasks.filter((task) => task.status !== 'Done').slice(0, 5),
    notifications: db.notifications
  });
});

// Users and profile management
app.get('/api/users', (req, res) => {
  const db = readDB();
  let users = db.users;
  if (req.query.role) users = users.filter((user) => user.role === req.query.role);
  if (req.query.status) users = users.filter((user) => user.status === req.query.status);
  if (req.query.search) users = users.filter((user) => includesSearch(user.name, req.query.search) || includesSearch(user.email, req.query.search));
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email || !role) return badRequest(res, 'Name, email and role are required.');
  const db = readDB();
  const user = { id: generateId('USR'), name, email, role, status: 'active', ...req.body };
  db.users.push(user);
  writeDB(db);
  res.status(201).json(user);
});

app.patch('/api/users/:id', (req, res) => {
  const db = readDB();
  const user = upsertById(db.users, req.params.id, req.body);
  if (!user) return notFound(res, 'User not found.');
  writeDB(db);
  res.json(user);
});

app.delete('/api/users/:id', (req, res) => {
  const db = readDB();
  const user = upsertById(db.users, req.params.id, { status: 'inactive' });
  if (!user) return notFound(res, 'User not found.');
  writeDB(db);
  res.json({ message: 'User deactivated', user });
});

// Events
app.get('/api/events', (req, res) => {
  const db = readDB();
  let events = db.events;
  if (req.query.date) events = events.filter((event) => event.date === req.query.date);
  if (req.query.status) events = events.filter((event) => event.status === req.query.status);
  res.json(events);
});

app.post('/api/events', (req, res) => {
  const { name, date, time } = req.body;
  if (!name || !date || !time) return badRequest(res, 'Event name, date and time are required.');
  const db = readDB();
  const event = { id: generateId('EVT'), status: 'Planning', expectedGuests: 0, ...req.body };
  db.events.push(event);
  writeDB(db);
  res.status(201).json(event);
});

app.patch('/api/events/:id', (req, res) => {
  const db = readDB();
  const event = upsertById(db.events, req.params.id, req.body);
  if (!event) return notFound(res, 'Event not found.');
  writeDB(db);
  res.json(event);
});

// Venues and booking requests
app.get('/api/venues', (req, res) => {
  const db = readDB();
  let venues = db.venues.filter((venue) => venue.status !== 'removed');
  if (req.query.city) venues = venues.filter((venue) => includesSearch(venue.city, req.query.city));
  if (req.query.search) venues = venues.filter((venue) => includesSearch(venue.name, req.query.search) || includesSearch(venue.location, req.query.search));
  if (req.query.availableDate) venues = venues.filter((venue) => venue.availableDates.includes(req.query.availableDate));
  if (req.query.minCapacity) venues = venues.filter((venue) => Number(venue.capacity) >= Number(req.query.minCapacity));
  res.json(venues);
});

app.post('/api/venues', (req, res) => {
  const { name, city, capacity, pricing } = req.body;
  if (!name || !city || !capacity || !pricing) return badRequest(res, 'Venue name, city, capacity and pricing are required.');
  const db = readDB();
  const venue = {
    id: generateId('VEN'),
    ownerId: req.body.ownerId || 'USR-VENUE-01',
    description: '',
    location: city,
    dimensions: 0,
    amenities: [],
    availableDates: [],
    photos: [],
    floorPlans: [],
    status: 'active',
    ...req.body
  };
  db.venues.push(venue);
  writeDB(db);
  res.status(201).json(venue);
});

app.patch('/api/venues/:id', (req, res) => {
  const db = readDB();
  const venue = upsertById(db.venues, req.params.id, req.body);
  if (!venue) return notFound(res, 'Venue not found.');
  writeDB(db);
  res.json(venue);
});

app.delete('/api/venues/:id', (req, res) => {
  const db = readDB();
  const venue = upsertById(db.venues, req.params.id, { status: req.query.permanent === 'true' ? 'removed' : 'inactive' });
  if (!venue) return notFound(res, 'Venue not found.');
  writeDB(db);
  res.json({ message: 'Venue listing updated', venue });
});

app.get('/api/booking-requests', (req, res) => {
  const db = readDB();
  let requests = db.bookingRequests;
  if (req.query.status) requests = requests.filter((request) => request.status === req.query.status);
  if (req.query.venueId) requests = requests.filter((request) => request.venueId === req.query.venueId);
  res.json(requests);
});

app.post('/api/booking-requests', (req, res) => {
  const { eventId, venueId, date } = req.body;
  if (!eventId || !venueId || !date) return badRequest(res, 'Event, venue and date are required.');
  const db = readDB();
  const event = findById(db.events, eventId);
  const venue = findById(db.venues, venueId);
  if (!event || !venue) return badRequest(res, 'A valid event and venue must be selected.');
  const request = {
    id: generateId('BR'),
    organizerId: event.organizerId,
    eventType: event.type,
    expectedAttendees: event.expectedGuests,
    specialRequirements: '',
    status: 'Pending',
    counterProposal: '',
    ...req.body
  };
  db.bookingRequests.push(request);
  writeDB(db);
  res.status(201).json(request);
});

app.patch('/api/booking-requests/:id', (req, res) => {
  const db = readDB();
  const request = upsertById(db.bookingRequests, req.params.id, req.body);
  if (!request) return notFound(res, 'Booking request not found.');
  writeDB(db);
  res.json(request);
});

// Tasks and staff
app.get('/api/tasks', (req, res) => {
  const db = readDB();
  let tasks = db.tasks;
  if (req.query.eventId) tasks = tasks.filter((task) => task.eventId === req.query.eventId);
  if (req.query.status) tasks = tasks.filter((task) => task.status === req.query.status);
  if (req.query.assignedTo) tasks = tasks.filter((task) => task.assignedTo === req.query.assignedTo);
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { eventId, title, dueDate } = req.body;
  if (!eventId || !title || !dueDate) return badRequest(res, 'Event, task title and due date are required.');
  const db = readDB();
  const task = { id: generateId('TASK'), status: 'Pending', assignedTo: '', reminderSent: false, ...req.body };
  db.tasks.push(task);
  writeDB(db);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const db = readDB();
  const task = upsertById(db.tasks, req.params.id, req.body);
  if (!task) return notFound(res, 'Task not found.');
  writeDB(db);
  res.json(task);
});

app.get('/api/staff', (req, res) => {
  const db = readDB();
  let staff = db.users.filter((user) => user.role === 'staff');
  if (req.query.speciality) staff = staff.filter((member) => includesSearch(member.speciality, req.query.speciality));
  if (req.query.employmentType) staff = staff.filter((member) => member.employmentType === req.query.employmentType);
  res.json(staff);
});

// Budget
app.get('/api/budgets/:eventId', (req, res) => {
  const db = readDB();
  const budget = db.budgets.find((item) => item.eventId === req.params.eventId);
  if (!budget) return notFound(res, 'Budget not found.');
  res.json(getBudgetSummary(budget));
});

app.patch('/api/budgets/:eventId', (req, res) => {
  const db = readDB();
  let budget = db.budgets.find((item) => item.eventId === req.params.eventId);
  if (!budget) {
    budget = { eventId: req.params.eventId, plannedTotal: 0, plannedItems: [], actualExpenses: [] };
    db.budgets.push(budget);
  }
  Object.assign(budget, req.body, { updatedAt: new Date().toISOString() });
  writeDB(db);
  res.json(getBudgetSummary(budget));
});

app.post('/api/budgets/:eventId/planned-items', (req, res) => {
  const { name, amount } = req.body;
  if (!name || amount === undefined) return badRequest(res, 'Planned item name and amount are required.');
  const db = readDB();
  let budget = db.budgets.find((item) => item.eventId === req.params.eventId);
  if (!budget) {
    budget = { eventId: req.params.eventId, plannedTotal: 0, plannedItems: [], actualExpenses: [] };
    db.budgets.push(budget);
  }
  const item = { id: generateId('PBI'), name, amount: Number(amount) };
  budget.plannedItems.push(item);
  writeDB(db);
  res.status(201).json(getBudgetSummary(budget));
});

app.post('/api/budgets/:eventId/actual-expenses', (req, res) => {
  const { name, amount } = req.body;
  if (!name || amount === undefined) return badRequest(res, 'Expense name and amount are required.');
  const db = readDB();
  let budget = db.budgets.find((item) => item.eventId === req.params.eventId);
  if (!budget) {
    budget = { eventId: req.params.eventId, plannedTotal: 0, plannedItems: [], actualExpenses: [] };
    db.budgets.push(budget);
  }
  const expense = { id: generateId('EXP'), name, amount: Number(amount), date: req.body.date || new Date().toISOString().slice(0, 10) };
  budget.actualExpenses.push(expense);
  writeDB(db);
  res.status(201).json(getBudgetSummary(budget));
});

// Layouts
app.get('/api/layouts/:eventId', (req, res) => {
  const db = readDB();
  const layout = db.layouts.find((item) => item.eventId === req.params.eventId);
  if (!layout) return res.json({ eventId: req.params.eventId, sharedWithSetupTeam: false, elements: [] });
  res.json(layout);
});

app.patch('/api/layouts/:eventId', (req, res) => {
  const db = readDB();
  let layout = db.layouts.find((item) => item.eventId === req.params.eventId);
  if (!layout) {
    layout = { eventId: req.params.eventId, sharedWithSetupTeam: false, elements: [] };
    db.layouts.push(layout);
  }
  Object.assign(layout, req.body, { updatedAt: new Date().toISOString() });
  writeDB(db);
  res.json(layout);
});

// Vendor management
app.get('/api/vendors', (req, res) => {
  const db = readDB();
  let vendors = db.vendors;
  if (req.query.search) vendors = vendors.filter((vendor) => includesSearch(vendor.name, req.query.search) || includesSearch(vendor.suppliesOffered.join(' '), req.query.search));
  res.json(vendors);
});

app.get('/api/sourcing-requests', (req, res) => {
  const db = readDB();
  let requests = db.sourcingRequests;
  if (req.query.eventId) requests = requests.filter((request) => request.eventId === req.query.eventId);
  if (req.query.vendorId) requests = requests.filter((request) => request.vendorId === req.query.vendorId);
  if (req.query.status) requests = requests.filter((request) => request.status === req.query.status);
  res.json(requests);
});

app.post('/api/sourcing-requests', (req, res) => {
  const { eventId, vendorId, items, deliveryDate } = req.body;
  if (!eventId || !vendorId || !items || !deliveryDate) return badRequest(res, 'Event, vendor, requested items and delivery date are required.');
  const db = readDB();
  const request = { id: generateId('SRC'), status: 'Pending', deliveryStatus: 'Not Started', delayNote: '', ...req.body };
  db.sourcingRequests.push(request);
  writeDB(db);
  res.status(201).json(request);
});

app.patch('/api/sourcing-requests/:id', (req, res) => {
  const db = readDB();
  const request = upsertById(db.sourcingRequests, req.params.id, req.body);
  if (!request) return notFound(res, 'Sourcing request not found.');
  writeDB(db);
  res.json(request);
});

app.get('/api/invoices', (req, res) => {
  const db = readDB();
  let invoices = db.invoices;
  if (req.query.vendorId) invoices = invoices.filter((invoice) => invoice.vendorId === req.query.vendorId);
  if (req.query.eventId) invoices = invoices.filter((invoice) => invoice.eventId === req.query.eventId);
  if (req.query.status) invoices = invoices.filter((invoice) => invoice.status === req.query.status);
  res.json(invoices);
});

app.post('/api/invoices', (req, res) => {
  const { eventId, vendorId, amount, items } = req.body;
  if (!eventId || !vendorId || amount === undefined || !items) return badRequest(res, 'Event, vendor, amount and items are required.');
  const db = readDB();
  const invoice = { id: generateId('INV'), status: 'Pending Review', attachments: [], ...req.body, amount: Number(amount) };
  db.invoices.push(invoice);
  writeDB(db);
  res.status(201).json(invoice);
});

app.patch('/api/invoices/:id', (req, res) => {
  const db = readDB();
  const invoice = upsertById(db.invoices, req.params.id, req.body);
  if (!invoice) return notFound(res, 'Invoice not found.');
  writeDB(db);
  res.json(invoice);
});

// Guest management
app.get('/api/guests', (req, res) => {
  const db = readDB();
  let guests = db.guests;
  if (req.query.eventId) guests = guests.filter((guest) => guest.eventId === req.query.eventId);
  if (req.query.rsvpStatus) guests = guests.filter((guest) => guest.rsvpStatus === req.query.rsvpStatus);
  if (req.query.dietaryPreference) guests = guests.filter((guest) => includesSearch(guest.dietaryPreference, req.query.dietaryPreference));
  if (req.query.checkedIn) guests = guests.filter((guest) => String(guest.checkedIn) === String(req.query.checkedIn));
  if (req.query.search) guests = guests.filter((guest) => includesSearch(guest.name, req.query.search) || includesSearch(guest.email, req.query.search));
  res.json(guests);
});

app.post('/api/guests', (req, res) => {
  const { eventId, name, email } = req.body;
  if (!eventId || !name || !email) return badRequest(res, 'Event, guest name and email are required.');
  const db = readDB();
  const guest = { id: generateId('GST'), rsvpStatus: 'Pending', dietaryPreference: '', specialRequirements: '', invitationSent: false, checkedIn: false, qrCode: `QR-${generateId('GST')}`, ...req.body };
  db.guests.push(guest);
  writeDB(db);
  res.status(201).json(guest);
});

app.post('/api/invitations', (req, res) => {
  const { eventId } = req.body;
  if (!eventId) return badRequest(res, 'Event is required to send invitations.');
  const db = readDB();
  const guests = db.guests.filter((guest) => guest.eventId === eventId);
  guests.forEach((guest) => { guest.invitationSent = true; });
  writeDB(db);
  res.json({ message: `Digital invitations marked as sent to ${guests.length} guests.`, guests });
});

app.patch('/api/guests/:id/rsvp', (req, res) => {
  const db = readDB();
  const guest = upsertById(db.guests, req.params.id, req.body);
  if (!guest) return notFound(res, 'Guest not found.');
  writeDB(db);
  res.json({ message: 'RSVP updated and confirmation sent.', guest });
});

app.patch('/api/guests/:id/checkin', (req, res) => {
  const db = readDB();
  const guest = upsertById(db.guests, req.params.id, { checkedIn: req.body.checkedIn !== false });
  if (!guest) return notFound(res, 'Guest not found.');
  writeDB(db);
  res.json({ message: 'Guest check-in status updated.', guest });
});

app.get('/api/communications', (req, res) => {
  const db = readDB();
  let communications = db.communications;
  if (req.query.eventId) communications = communications.filter((item) => item.eventId === req.query.eventId);
  res.json(communications);
});

app.post('/api/communications', (req, res) => {
  const { eventId, message } = req.body;
  if (!eventId || !message) return badRequest(res, 'Event and message are required.');
  const db = readDB();
  const guests = db.guests.filter((guest) => guest.eventId === eventId && (!req.body.unseenOnly || !guest.lastMessageSeen));
  const communication = {
    id: generateId('COM'),
    eventId,
    message,
    sentAt: new Date().toISOString(),
    recipients: guests.map((guest) => ({ guestId: guest.id, seen: false }))
  };
  db.communications.push(communication);
  writeDB(db);
  res.status(201).json(communication);
});

app.patch('/api/communications/:id/seen', (req, res) => {
  const { guestId } = req.body;
  if (!guestId) return badRequest(res, 'Guest ID is required.');
  const db = readDB();
  const communication = findById(db.communications, req.params.id);
  if (!communication) return notFound(res, 'Communication not found.');
  const recipient = communication.recipients.find((item) => item.guestId === guestId);
  if (!recipient) return notFound(res, 'Guest recipient not found.');
  recipient.seen = true;
  writeDB(db);
  res.json(communication);
});

// Feedback and reporting
app.get('/api/feedback', (req, res) => {
  const db = readDB();
  let feedback = db.feedback;
  if (req.query.eventId) feedback = feedback.filter((item) => item.eventId === req.query.eventId);
  res.json(feedback);
});

app.post('/api/feedback', (req, res) => {
  const { eventId, guestId, overall } = req.body;
  if (!eventId || !guestId || !overall) return badRequest(res, 'Event, guest and overall rating are required.');
  const db = readDB();
  const feedback = { id: generateId('FDB'), food: 0, venue: 0, organization: 0, comments: '', ...req.body };
  db.feedback.push(feedback);
  writeDB(db);
  res.status(201).json({ message: 'Thank you for your feedback.', feedback });
});

app.get('/api/reports/:eventId', (req, res) => {
  const db = readDB();
  const report = buildReport(db, req.params.eventId);
  if (!report) return notFound(res, 'Event report not found.');
  res.json(report);
});

app.get('/api/reports/:eventId/export', (req, res) => {
  const db = readDB();
  const report = buildReport(db, req.params.eventId);
  if (!report) return notFound(res, 'Event report not found.');
  res.setHeader('Content-Disposition', `attachment; filename=${req.params.eventId}-report.json`);
  res.json(report);
});

app.get('/api/venue-owner/overview', (req, res) => {
  const db = readDB();
  const ownerId = req.query.ownerId || 'USR-VENUE-01';
  const venues = db.venues.filter((venue) => venue.ownerId === ownerId && venue.status !== 'removed');
  const venueIds = venues.map((venue) => venue.id);
  const requests = db.bookingRequests.filter((request) => venueIds.includes(request.venueId));
  const confirmed = requests.filter((request) => request.status === 'Approved');
  const revenue = confirmed.reduce((sum, request) => {
    const venue = findById(db.venues, request.venueId);
    return sum + Number(venue?.pricing || 0);
  }, 0);
  res.json({
    ownerId,
    venues,
    requests,
    confirmedBookings: confirmed,
    metrics: {
      totalListings: venues.length,
      totalRequests: requests.length,
      totalConfirmed: confirmed.length,
      bookingRate: requests.length ? Number(((confirmed.length / requests.length) * 100).toFixed(1)) : 0,
      revenue
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

app.listen(PORT, () => {
  console.log(`PopEyez backend running on http://localhost:${PORT}`);
});
