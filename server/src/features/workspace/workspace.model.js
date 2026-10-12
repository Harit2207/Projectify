import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'member'],
        default: 'member',
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const workspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Workspace name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        maxlength: [200, 'Description too long'],
        default: '',
    },
    logo: {
        type: String,
        default: null,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [memberSchema],
},
    { timestamps: true },
);


//finding all workspace this user belongs to
workspaceSchema.index({ 'members.userId': 1 });


workspaceSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find((m) => {
    const memberId = m.userId._id || m.userId;

    return memberId.toString() === userId.toString();
  });

  return member?.role ?? null;
};

workspaceSchema.methods.isMember = function (userId) {
  return this.members.some((m) => {
    const memberId = m.userId._id || m.userId;
    return memberId.toString() === userId.toString();
  });
};
export const Workspace = mongoose.model('Workspace', workspaceSchema);