import { Schema, model } from 'mongoose';
const studentSchema = new Schema({
 studentId: { type: String, required: true, unique: true, index: true },
 fullName: { type: String, required: true },
 programme: { type: String, required: true, index: true },
 yearGroup: { type: Number, required: true, index: true },
 track: { type: String, default: 'standard' }
}, { timestamps: true });
studentSchema.index({ programme: 1, yearGroup: 1 });
export const Student = model('Student', studentSchema);
const attemptSchema = new Schema({
 courseCode: { type: String, required: true },
 credits: { type: Number, required: true, min: 0 },
 grade: String, status: { type: String, enum: ['COMPLETED','ENROLLED','INCOMPLETE'], required: true },
 semester: String, attemptedAt: Date
}, { _id: true });
const enrollmentSchema = new Schema({
 studentId: { type: String, required: true, index: true },
 courseCode: { type: String, required: true },
 attempts: [attemptSchema]
}, { timestamps: true });
enrollmentSchema.index({ studentId: 1, courseCode: 1 }, { unique: true });
export const Enrollment = model('Enrollment', enrollmentSchema);
const requirementSchema = new Schema({
 programme: { type: String, required: true, index: true },
 version: { type: String, required: true },
 effectiveFrom: Date, track: { type: String, required: true },
 creditsRequired: { type: Number, required: true },
 requirements: [{ courseCode: String, name: String, category: String, credits: Number, minPassingGrade: String }]
}, { timestamps: true });
requirementSchema.index({ programme: 1, version: 1, track: 1 }, { unique: true });
export const ProgrammeRequirement = model('ProgrammeRequirement', requirementSchema);
