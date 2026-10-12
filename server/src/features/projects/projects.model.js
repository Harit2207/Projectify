import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Name too long'],
    },
    description: {
      type: String,
      maxlength: [500, ''],
      default: '',
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    emoji: {
      type: String,
      default: '📋',
    },
  },
  { timestamps: true },
);

// Compound index — most queries are "projects in workspace X"
projectSchema.index({ workspaceId: 1, createdAt: -1 });

export const Project = mongoose.model('Project', projectSchema);