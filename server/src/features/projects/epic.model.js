import mongoose from 'mongoose';

const epicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Epic title is required'],
      trim: true,
      maxlength: [150, 'Title too long'],
    },
    description: {
      type: String,
      maxlength: [1000, ''],
      default: '',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['planned', 'in_progress', 'completed', 'cancelled'],
      default: 'planned',
    },
    color: {
      type: String,
      default: '#6366f1', // indigo
      match: [/^#[0-9a-fA-F]{6}$/, 'Invalid color format'],
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true },
);

epicSchema.index({ projectId: 1, createdAt: -1 });


epicSchema.virtual('progress').get(function () {
  if (!this._taskStats) return 0;
  const { total, completed } = this._taskStats;
  return total === 0 ? 0 : Math.round((completed / total) * 100);
});

export const Epic = mongoose.model('Epic', epicSchema);