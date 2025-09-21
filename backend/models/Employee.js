const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
});

const EmergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
});

const EmployeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true, index: true },
    dob: { type: Date, required: true },
    department: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Department", 
      required: true,
      index: true 
    },
    role: { type: String, required: true, index: true },
    employmentType: { 
      type: String, 
      required: true, 
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      index: true 
    },
    hireDate: { type: Date, required: true, index: true },
    salary: { type: Number, min: 0, index: true },
    employeeId: { type: String, required: true, unique: true, index: true },
    address: { type: AddressSchema, required: true },
    emergencyContact: { type: EmergencyContactSchema, required: true },
  },
  { timestamps: true }
);


EmployeeSchema.index({ createdAt: -1 });
EmployeeSchema.index({ name: 1, email: 1 });
EmployeeSchema.index({ department: 1, role: 1 }); 

module.exports = mongoose.model("Employee", EmployeeSchema);