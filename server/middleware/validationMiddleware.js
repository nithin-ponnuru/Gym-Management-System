const validateMember = (req, res, next) => {
  const { name, email, phone, age } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
  if (!phone || !/^[\d\s\-\+\(\)]{7,15}$/.test(phone)) errors.push('Valid phone number is required');
  if (age && (isNaN(age) || age < 5 || age > 120)) errors.push('Age must be between 5 and 120');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  next();
};

const validateTrainer = (req, res, next) => {
  const { name, email, phone, experience, salary } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
  if (!phone || !/^[\d\s\-\+\(\)]{7,15}$/.test(phone)) errors.push('Valid phone number is required');
  if (experience !== undefined && (isNaN(experience) || experience < 0)) errors.push('Experience cannot be negative');
  if (salary !== undefined && (isNaN(salary) || salary < 0)) errors.push('Salary cannot be negative');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  next();
};

const validateMembership = (req, res, next) => {
  const { planName, durationMonths, price } = req.body;
  const errors = [];

  if (!planName || planName.trim().length < 2) errors.push('Plan name must be at least 2 characters');
  if (!durationMonths || isNaN(durationMonths) || durationMonths < 1) errors.push('Duration must be at least 1 month');
  if (!price || isNaN(price) || price < 0) errors.push('Price must be a positive number');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  next();
};

module.exports = { validateMember, validateTrainer, validateMembership };
