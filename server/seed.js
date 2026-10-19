require('dotenv').config();
const mongoose = require('mongoose');

const Member = require('./models/Member');
const Trainer = require('./models/Trainer');
const Membership = require('./models/Membership');
const MemberMembership = require('./models/MemberMembership');
const WorkoutPlan = require('./models/WorkoutPlan');
const Attendance = require('./models/Attendance');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'GymManagementDB' });
  console.log('Connected to MongoDB for seeding...');
};

const seedData = async () => {
  await connectDB();

  // Clear all collections
  await Promise.all([
    Member.deleteMany({}),
    Trainer.deleteMany({}),
    Membership.deleteMany({}),
    MemberMembership.deleteMany({}),
    WorkoutPlan.deleteMany({}),
    Attendance.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // --- TRAINERS ---
  const trainers = await Trainer.insertMany([
    { name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@gymfit.com', specialization: 'Weight Training', experience: 8, salary: 45000, status: 'Active', bio: 'Expert in powerlifting and bodybuilding with 8 years of experience.' },
    { name: 'Priya Sharma', phone: '9876543211', email: 'priya@gymfit.com', specialization: 'Yoga', experience: 5, salary: 38000, status: 'Active', bio: 'Certified yoga instructor specializing in Hatha and Vinyasa yoga.' },
    { name: 'Amit Singh', phone: '9876543212', email: 'amit@gymfit.com', specialization: 'CrossFit', experience: 6, salary: 42000, status: 'Active', bio: 'CrossFit Level 2 trainer with a passion for functional fitness.' },
    { name: 'Sunita Patel', phone: '9876543213', email: 'sunita@gymfit.com', specialization: 'Cardio', experience: 4, salary: 35000, status: 'Active', bio: 'Cardio and endurance specialist, marathon runner.' },
    { name: 'Vikram Mehta', phone: '9876543214', email: 'vikram@gymfit.com', specialization: 'Strength Training', experience: 10, salary: 55000, status: 'Active', bio: 'Former national-level weightlifter, now a certified strength coach.' },
  ]);
  console.log(`Seeded ${trainers.length} trainers`);

  // --- MEMBERSHIP PLANS ---
  const memberships = await Membership.insertMany([
    { planName: 'Basic', durationMonths: 1, price: 999, features: ['Gym Access', 'Basic Equipment', 'Locker Access'], isPopular: false, color: '#6366f1' },
    { planName: 'Standard', durationMonths: 3, price: 2499, features: ['Gym Access', 'All Equipment', 'Locker Access', 'Group Classes', '1 PT Session/month'], isPopular: true, color: '#8b5cf6' },
    { planName: 'Premium', durationMonths: 6, price: 4499, features: ['Gym Access', 'All Equipment', 'Locker Access', 'Group Classes', '4 PT Sessions/month', 'Diet Consultation', 'Sauna Access'], isPopular: false, color: '#f59e0b' },
    { planName: 'Gold', durationMonths: 12, price: 7999, features: ['Unlimited Access', 'All Equipment', 'Locker Access', 'All Group Classes', 'Unlimited PT Sessions', 'Diet Plan', 'Sauna & Spa', 'Guest Passes'], isPopular: false, color: '#ef4444' },
  ]);
  console.log(`Seeded ${memberships.length} membership plans`);

  // --- MEMBERS ---
  const memberData = [
    { name: 'Arjun Nair', age: 28, gender: 'Male', phone: '9000000001', email: 'arjun@example.com', address: 'Mumbai, Maharashtra', trainerId: trainers[0]._id, status: 'Active' },
    { name: 'Kavya Reddy', age: 25, gender: 'Female', phone: '9000000002', email: 'kavya@example.com', address: 'Pune, Maharashtra', trainerId: trainers[1]._id, status: 'Active' },
    { name: 'Rohit Verma', age: 32, gender: 'Male', phone: '9000000003', email: 'rohit@example.com', address: 'Delhi, NCR', trainerId: trainers[2]._id, status: 'Active' },
    { name: 'Sneha Gupta', age: 26, gender: 'Female', phone: '9000000004', email: 'sneha@example.com', address: 'Bangalore, Karnataka', trainerId: trainers[1]._id, status: 'Active' },
    { name: 'Manish Tiwari', age: 35, gender: 'Male', phone: '9000000005', email: 'manish@example.com', address: 'Chennai, Tamil Nadu', trainerId: trainers[4]._id, status: 'Active' },
    { name: 'Ananya Joshi', age: 22, gender: 'Female', phone: '9000000006', email: 'ananya@example.com', address: 'Hyderabad, Telangana', trainerId: trainers[0]._id, status: 'Active' },
    { name: 'Siddharth Rao', age: 29, gender: 'Male', phone: '9000000007', email: 'siddharth@example.com', address: 'Kolkata, West Bengal', trainerId: trainers[3]._id, status: 'Active' },
    { name: 'Meera Pillai', age: 31, gender: 'Female', phone: '9000000008', email: 'meera@example.com', address: 'Ahmedabad, Gujarat', trainerId: trainers[2]._id, status: 'Active' },
    { name: 'Karan Malhotra', age: 24, gender: 'Male', phone: '9000000009', email: 'karan@example.com', address: 'Jaipur, Rajasthan', trainerId: trainers[4]._id, status: 'Active' },
    { name: 'Pooja Desai', age: 27, gender: 'Female', phone: '9000000010', email: 'pooja@example.com', address: 'Surat, Gujarat', trainerId: trainers[1]._id, status: 'Active' },
    { name: 'Aditya Bhatt', age: 33, gender: 'Male', phone: '9000000011', email: 'aditya@example.com', address: 'Lucknow, UP', trainerId: trainers[0]._id, status: 'Inactive' },
    { name: 'Riya Shah', age: 21, gender: 'Female', phone: '9000000012', email: 'riya@example.com', address: 'Nagpur, Maharashtra', trainerId: trainers[3]._id, status: 'Active' },
    { name: 'Deepak Chandra', age: 38, gender: 'Male', phone: '9000000013', email: 'deepak@example.com', address: 'Bhopal, MP', trainerId: trainers[2]._id, status: 'Active' },
    { name: 'Nisha Agarwal', age: 30, gender: 'Female', phone: '9000000014', email: 'nisha@example.com', address: 'Indore, MP', trainerId: trainers[4]._id, status: 'Inactive' },
    { name: 'Varun Saxena', age: 26, gender: 'Male', phone: '9000000015', email: 'varun@example.com', address: 'Patna, Bihar', trainerId: trainers[0]._id, status: 'Active' },
  ];
  const members = await Member.insertMany(memberData);
  console.log(`Seeded ${members.length} members`);

  // --- MEMBER MEMBERSHIPS (spread over 6 months) ---
  const memberMembershipData = [];
  const paymentStatuses = ['Paid', 'Paid', 'Paid', 'Partial', 'Paid'];
  const planAssignments = [
    { memberIdx: 0, planIdx: 2, monthsAgo: 5 },
    { memberIdx: 1, planIdx: 1, monthsAgo: 4 },
    { memberIdx: 2, planIdx: 3, monthsAgo: 3 },
    { memberIdx: 3, planIdx: 1, monthsAgo: 3 },
    { memberIdx: 4, planIdx: 2, monthsAgo: 2 },
    { memberIdx: 5, planIdx: 0, monthsAgo: 2 },
    { memberIdx: 6, planIdx: 1, monthsAgo: 2 },
    { memberIdx: 7, planIdx: 3, monthsAgo: 1 },
    { memberIdx: 8, planIdx: 2, monthsAgo: 1 },
    { memberIdx: 9, planIdx: 1, monthsAgo: 1 },
    { memberIdx: 10, planIdx: 0, monthsAgo: 5 },
    { memberIdx: 11, planIdx: 0, monthsAgo: 0 },
    { memberIdx: 12, planIdx: 2, monthsAgo: 0 },
    { memberIdx: 13, planIdx: 1, monthsAgo: 4 },
    { memberIdx: 14, planIdx: 3, monthsAgo: 0 },
  ];

  for (let i = 0; i < planAssignments.length; i++) {
    const { memberIdx, planIdx, monthsAgo } = planAssignments[i];
    const plan = memberships[planIdx];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsAgo);
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + plan.durationMonths);

    memberMembershipData.push({
      memberId: members[memberIdx]._id,
      membershipId: plan._id,
      startDate,
      expiryDate,
      amountPaid: plan.price,
      paymentStatus: paymentStatuses[i % paymentStatuses.length],
      status: expiryDate > new Date() ? 'Active' : 'Expired',
    });
  }

  await MemberMembership.insertMany(memberMembershipData);
  console.log(`Seeded ${memberMembershipData.length} member memberships`);

  // --- WORKOUT PLANS ---
  const workoutPlans = await WorkoutPlan.insertMany([
    {
      planName: 'Fat Burner Program',
      goal: 'Weight Loss',
      durationWeeks: 8,
      trainerId: trainers[3]._id,
      difficulty: 'Intermediate',
      description: 'A high-intensity cardio and strength combination program designed for maximum fat loss.',
      exercises: [
        { name: 'Treadmill Running', sets: 1, reps: 1, restSeconds: 0, notes: '30 minutes at 70% max HR' },
        { name: 'Burpees', sets: 4, reps: 15, restSeconds: 60 },
        { name: 'Jump Squats', sets: 3, reps: 20, restSeconds: 45 },
        { name: 'Mountain Climbers', sets: 3, reps: 30, restSeconds: 30 },
        { name: 'Plank', sets: 3, reps: 1, restSeconds: 60, notes: 'Hold for 60 seconds each' },
      ],
    },
    {
      planName: 'Muscle Builder Elite',
      goal: 'Muscle Gain',
      durationWeeks: 12,
      trainerId: trainers[0]._id,
      difficulty: 'Advanced',
      description: 'Progressive overload program focused on hypertrophy and strength gains.',
      exercises: [
        { name: 'Barbell Bench Press', sets: 5, reps: 6, restSeconds: 180 },
        { name: 'Barbell Squat', sets: 5, reps: 6, restSeconds: 180 },
        { name: 'Deadlift', sets: 4, reps: 5, restSeconds: 240 },
        { name: 'Pull-ups', sets: 4, reps: 8, restSeconds: 120 },
        { name: 'Overhead Press', sets: 4, reps: 8, restSeconds: 120 },
        { name: 'Barbell Row', sets: 4, reps: 8, restSeconds: 120 },
      ],
    },
    {
      planName: 'Yoga Flow & Flexibility',
      goal: 'Flexibility',
      durationWeeks: 6,
      trainerId: trainers[1]._id,
      difficulty: 'Beginner',
      description: 'A gentle yoga program for improving flexibility, balance, and mindfulness.',
      exercises: [
        { name: 'Sun Salutation', sets: 3, reps: 5, restSeconds: 60 },
        { name: 'Warrior Pose Sequence', sets: 2, reps: 8, restSeconds: 45 },
        { name: 'Child Pose', sets: 1, reps: 1, restSeconds: 0, notes: 'Hold for 2 minutes' },
        { name: 'Downward Dog', sets: 3, reps: 1, restSeconds: 30, notes: 'Hold for 30 seconds' },
        { name: 'Pigeon Pose', sets: 2, reps: 1, restSeconds: 30, notes: 'Hold for 90 seconds each side' },
      ],
    },
    {
      planName: 'CrossFit Fundamentals',
      goal: 'General Fitness',
      durationWeeks: 10,
      trainerId: trainers[2]._id,
      difficulty: 'Intermediate',
      description: 'WOD-based training combining gymnastics, weightlifting, and cardio.',
      exercises: [
        { name: 'Box Jumps', sets: 5, reps: 10, restSeconds: 90 },
        { name: 'Kettlebell Swings', sets: 5, reps: 20, restSeconds: 60 },
        { name: 'Rope Climbs', sets: 3, reps: 3, restSeconds: 120 },
        { name: 'Double Unders', sets: 5, reps: 50, restSeconds: 60 },
        { name: 'Thrusters', sets: 4, reps: 15, restSeconds: 90 },
        { name: 'Toes-to-Bar', sets: 4, reps: 12, restSeconds: 60 },
      ],
    },
    {
      planName: 'Powerlifting Foundation',
      goal: 'Strength',
      durationWeeks: 16,
      trainerId: trainers[4]._id,
      difficulty: 'Advanced',
      description: 'Structured powerlifting program with periodization for peak strength.',
      exercises: [
        { name: 'Competition Squat', sets: 5, reps: 3, restSeconds: 300 },
        { name: 'Competition Bench', sets: 5, reps: 3, restSeconds: 300 },
        { name: 'Competition Deadlift', sets: 4, reps: 2, restSeconds: 360 },
        { name: 'Romanian Deadlift', sets: 4, reps: 8, restSeconds: 180 },
        { name: 'Pause Squat', sets: 3, reps: 5, restSeconds: 240 },
        { name: 'Close Grip Bench', sets: 4, reps: 8, restSeconds: 180 },
      ],
    },
  ]);
  console.log(`Seeded ${workoutPlans.length} workout plans`);

  // --- ATTENDANCE (last 35 days) ---
  const attendanceRecords = [];
  const activeMembers = members.filter(m => m.status === 'Active');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 34; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);

    // Skip some days to make data realistic
    if (date.getDay() === 0 && Math.random() > 0.3) continue; // Some Sundays off

    // Randomly select 5-11 members per day
    const count = Math.floor(Math.random() * 7) + 5;
    const shuffled = [...activeMembers].sort(() => 0.5 - Math.random());
    const dayAttendees = shuffled.slice(0, Math.min(count, activeMembers.length));

    for (const member of dayAttendees) {
      const hour = 6 + Math.floor(Math.random() * 6); // 6am to 11am
      const minute = Math.floor(Math.random() * 60);
      const checkIn = `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
      const checkOutHour = hour + 1 + Math.floor(Math.random() * 2);
      const checkOut = `${checkOutHour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;

      attendanceRecords.push({
        memberId: member._id,
        date,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        status: 'Present',
      });
    }
  }

  // Use insertMany with ordered:false to skip duplicates
  try {
    await Attendance.insertMany(attendanceRecords, { ordered: false });
  } catch (err) {
    // Ignore duplicate key errors
    if (err.code !== 11000) throw err;
  }
  console.log(`Seeded ~${attendanceRecords.length} attendance records`);

  console.log('\n✅ Database seeding complete!');
  console.log('   - 5 Trainers');
  console.log('   - 15 Members');
  console.log('   - 4 Membership Plans');
  console.log('   - 15 Member Memberships');
  console.log('   - 5 Workout Plans');
  console.log('   - 35+ days of Attendance');

  await mongoose.connection.close();
  process.exit(0);
};

seedData().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});