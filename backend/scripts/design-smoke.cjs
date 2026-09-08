// Isolated local UI smoke environment. Never connects to the configured application database.
const os = require('os');
if (os.freemem() < 2 * 1024 ** 3) throw new Error('Not enough free memory for the local smoke environment.');
Object.assign(process.env, { NODE_ENV: 'test', JWT_SECRET: require('crypto').randomBytes(32).toString('hex'), MONGODB_URI: 'mongodb://127.0.0.1:0/unused', FRONTEND_URL: 'http://localhost:5173', FRONTEND_URLS: 'http://127.0.0.1:5173', SMTP_USER: '', SMTP_PASS: '', RESEND_API_KEY: '', AI_SERVICE_URL: 'http://127.0.0.1:1' });
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
let database, server;
async function stop() { if (server) server.close(); await mongoose.disconnect(); if (database) await database.stop(); process.exit(0); }
(async () => {
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  const User = require('../src/models/User');
  const Resume = require('../src/models/Resume');
  const Profile = require('../src/models/CandidateProfile');
  const Job = require('../src/models/JobRequirement');
  const Application = require('../src/models/Application');
  const Match = require('../src/models/MatchResult');
  const recruiter = await User.create({ fullName: 'Review Recruiter', email: 'recruiter@design.test', password: 'DesignReview123!', role: 'recruiter', isVerified: true });
  const candidate = await User.create({ fullName: 'Review Candidate', email: 'candidate@design.test', password: 'DesignReview123!', role: 'candidate', isVerified: true });
  await User.create({ fullName: 'Review Admin', email: 'admin@design.test', password: 'DesignReview123!', role: 'admin', isVerified: true });
  const resume = await Resume.create({ uploadedBy: candidate._id, originalFileName: 'review-resume.pdf', mimeType: 'application/pdf', fileSize: 1024, isDefault: true, parseStatus: 'done' });
  const profile = await Profile.create({ user: candidate._id, resumeId: resume._id, fullName: candidate.fullName, email: candidate.email, skills: ['Customer service', 'Excel'], yearsExperience: 2, educationLevel: 'bachelor' });
  const role = await Job.create({ createdBy: recruiter._id, title: 'Customer Service Assistant', description: 'Help customers with enquiries and keep accurate records.', requiredSkills: ['Customer service'], requiredExperienceYears: 1, isOpen: true });
  const existing = await Job.create({ createdBy: recruiter._id, title: 'Office Coordinator', description: 'Coordinate daily office operations and maintain records.', requiredSkills: ['Excel'], isOpen: true, lastMatchedAt: new Date() });
  await Application.create({ candidate: candidate._id, candidateProfile: profile._id, job: existing._id, status: 'reviewed' });
  await Match.create({ job: existing._id, candidate: profile._id, rankedPosition: 1, totalScore: .8, scoreBreakdown: { skills: 1, experience: 1, education: 1, semantic: .5 }, matchedSkills: ['Excel'], missingSkills: [], explanation: 'The profile lists the required spreadsheet skill.' });
  server = require('../src/app').listen(5000, '127.0.0.1', () => console.log('Isolated smoke API ready on localhost:5000. Type stop to shut down.'));
  setTimeout(stop, 20 * 60 * 1000).unref();
  process.stdin.on('data', data => { if (String(data).trim() === 'stop') stop(); });
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
})().catch(async error => { console.error(error.message); await stop(); });
