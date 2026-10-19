require('dotenv').config();
const mongoose = require('mongoose');
const Membership = require('./models/Membership');

const PREDEFINED_PLANS = [
  {
    planName: 'Monthly Plan',
    durationMonths: 1,
    price: 1000,
    description: 'Perfect for beginners and those wanting month-to-month flexibility.',
    features: [
      'Gym Access (6 AM – 10 PM)',
      'Basic Equipment Access',
      'General Workout Area',
      'Locker Access',
    ],
    isPopular: true,
    isBestValue: false,
    badge: 'Popular',
    status: 'Active',
    color: '#6366f1',
  },
  {
    planName: 'Quarterly Plan',
    durationMonths: 3,
    price: 2700,
    description: 'Great for members who want to train regularly for three months.',
    features: [
      'Full Gym Access (6 AM – 10 PM)',
      'All Workout Equipment',
      'Fitness Assessment',
      'Locker Access',
      'Group Classes',
    ],
    isPopular: false,
    isBestValue: false,
    badge: '',
    status: 'Active',
    color: '#8b5cf6',
  },
  {
    planName: 'Half-Yearly Plan',
    durationMonths: 6,
    price: 5000,
    description: 'Ideal for members with a longer-term fitness commitment.',
    features: [
      'Full Gym Access (6 AM – 10 PM)',
      'Fitness Assessment',
      'Personalized Workout Plan',
      'Monthly Progress Tracking',
      'Locker Access',
      'Group Classes',
    ],
    isPopular: false,
    isBestValue: false,
    badge: '',
    status: 'Active',
    color: '#f59e0b',
  },
  {
    planName: 'Yearly Plan',
    durationMonths: 12,
    price: 9000,
    description: 'Our best value plan for serious fitness enthusiasts.',
    features: [
      'Full Gym Access (6 AM – 10 PM)',
      'Personalized Workout Plan',
      'Fitness Assessment',
      'Monthly Progress Tracking',
      'Priority Trainer Consultation',
      'All Group Classes',
      'Locker Access',
      'Guest Passes (2/month)',
    ],
    isPopular: false,
    isBestValue: true,
    badge: 'Best Value',
    status: 'Active',
    color: '#ef4444',
  },
  {
    planName: 'Personal Training Plan',
    durationMonths: 1,
    price: 4000,
    description: 'For members who want dedicated personal trainer support.',
    features: [
      'Full Gym Access (6 AM – 10 PM)',
      'Personal Trainer Assignment',
      'Personalized Workout Schedule',
      'Progress Monitoring',
      'Trainer Guidance & Support',
      'Nutrition Consultation',
      'Locker Access',
    ],
    isPopular: false,
    isBestValue: false,
    badge: 'Premium',
    status: 'Active',
    color: '#10b981',
  },
];

async function seedPlans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'GymManagementDB' });
    console.log('Connected to MongoDB for plan seeding...');

    let inserted = 0;
    let skipped = 0;

    for (const plan of PREDEFINED_PLANS) {
      const existing = await Membership.findOne({ planName: plan.planName });
      if (existing) {
        console.log(`[SKIP] Plan already exists: ${plan.planName}`);
        skipped++;
      } else {
        await Membership.create(plan);
        console.log(`[CREATED] ${plan.planName} — ₹${plan.price}/${plan.durationMonths} month(s)`);
        inserted++;
      }
    }

    console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding plans:', err.message);
    process.exit(1);
  }
}

seedPlans();
