import mongoose, { Schema, Document } from "mongoose";

export interface ILeads extends Document {
  name: string;
  email?: string;
  contactNo: string;
  message?: string;
}

const LeadsSchema: Schema<ILeads> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactNo: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Leads = mongoose.model<ILeads>("Leads", LeadsSchema);
export default Leads;
