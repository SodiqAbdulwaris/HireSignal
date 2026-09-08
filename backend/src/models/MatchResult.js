const mongoose = require('mongoose');

const scoreBreakdownSchema = new mongoose.Schema(
  {
    skills: { type: Number, min: 0, max: 1 },
    experience: { type: Number, min: 0, max: 1 },
    semantic: { type: Number, min: 0, max: 1 },
    education: { type: Number, min: 0, max: 1 },
  },
  { _id: false }
);

const matchResultSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequirement', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateProfile', required: true },
    rankedPosition: { type: Number, required: true },
    totalScore: { type: Number, required: true, min: 0, max: 1 },
    scoreBreakdown: { type: scoreBreakdownSchema, required: true },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    supportingReasons: { type: [String], default: [] },
    concerns: { type: [String], default: [] },
    explanation: { type: String },
    shortlisted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

matchResultSchema.index({ job: 1, candidate: 1 }, { unique: true });
matchResultSchema.index({ job: 1 });

module.exports = mongoose.model('MatchResult', matchResultSchema);