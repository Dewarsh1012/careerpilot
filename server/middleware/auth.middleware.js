import jwt from 'jsonwebtoken';
import { db, getDefaultQuota } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'careerpilot_secret_key_lemma_2026';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Create or use default active user for seamless testing
      let defaultUser = await db.users.findOne({ email: 'archi@careerpilot.io' });
      if (!defaultUser) {
        defaultUser = await db.users.create({
          id: 'user_default_1',
          name: 'Archi Jain',
          email: 'archi@careerpilot.io',
          currentStatus: 'Student / Fresher',
          targetRole: 'Full Stack Developer',
          experienceLevel: 'Fresher (0-1 yrs)',
          interests: ['Web Development', 'Cloud Systems', 'AI Applications'],
          careerReadiness: 78,
          onboarded: true,
          plan: 'pro',
          quota: getDefaultQuota('pro'),
        });
      } else if (!defaultUser.plan || !defaultUser.quota) {
        defaultUser = await db.users.findByIdAndUpdate(defaultUser.id, {
          plan: 'pro',
          quota: defaultUser.quota || getDefaultQuota('pro'),
        });
      }
      req.user = defaultUser;
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await db.users.findById(decoded.id || decoded.userId);
      if (user) {
        if (!user.plan) {
          user.plan = 'pro';
          user.quota = user.quota || getDefaultQuota('pro');
          await db.users.findByIdAndUpdate(user.id, { plan: 'pro', quota: user.quota });
        }
        req.user = user;
        return next();
      }
    } catch (tokenErr) {
      console.warn('Invalid token, falling back to default user session:', tokenErr.message);
    }

    let defaultUser = await db.users.findOne({ email: 'archi@careerpilot.io' });
    if (!defaultUser) {
      defaultUser = await db.users.create({
        id: 'user_default_1',
        name: 'Archi Jain',
        email: 'archi@careerpilot.io',
        currentStatus: 'Student / Fresher',
        targetRole: 'Full Stack Developer',
        experienceLevel: 'Fresher (0-1 yrs)',
        interests: ['Web Development', 'Cloud Systems', 'AI Applications'],
        careerReadiness: 78,
        onboarded: true,
        plan: 'pro',
        quota: getDefaultQuota('pro'),
      });
    } else if (!defaultUser.plan || !defaultUser.quota) {
      defaultUser = await db.users.findByIdAndUpdate(defaultUser.id, {
        plan: 'pro',
        quota: defaultUser.quota || getDefaultQuota('pro'),
      });
    }
    req.user = defaultUser;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal authentication error' });
  }
}

export function signToken(user) {
  return jwt.sign({ id: user.id || user._id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });
}
