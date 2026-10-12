import mongoose from 'mongoose';

const STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];
const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [255, 'Title too long'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [5000, 'Description too long'],
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'todo',
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'none',
    },
    
    position: {
      type: Number,
      default: 0,
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
      index: true,
    },
    epicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Epic',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dueDate: {
      type: Date,
      default: null,
    },
    labels: [
      {
        type: String,
        trim: true,
        maxlength: 30,
      },
    ],
    
    checklist: [
      {
        text: { type: String, required: true, maxlength: 255 },
        completed: { type: Boolean, default: false },
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      },
    ],
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────
taskSchema.index({ projectId: 1, status: 1, position: 1 }); //used kanban boards
taskSchema.index({ workspaceId: 1, assignees: 1 });
taskSchema.index({ workspaceId: 1, dueDate: 1 });

// ── Hooks ─────────────────────────────────────────────────────────
taskSchema.pre('save', function () {
  if (this.isModified('status')) {
    if (this.status === 'done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'done') {
      this.completedAt = null;
    }
  }
});

export const Task = mongoose.model('Task', taskSchema);
export { STATUSES, PRIORITIES };