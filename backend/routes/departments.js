const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// Create department
router.post('/', async (req, res) => {
  try {
    const existingDept = await Department.findOne({ name: req.body.name });
    if (existingDept) {
      return res.status(400).json({ error: 'Department already exists' });
    }
    
    const d = new Department(req.body);
    await d.save();
    res.status(201).json(d);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Get all departments
router.get('/', async (req, res) => {
  try {
    const list = await Department.find().sort({ name: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single department
router.get('/:id', async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid department ID' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    
    if (req.body.name) {
      const existingDept = await Department.findOne({
        _id: { $ne: req.params.id },
        name: req.body.name
      });
      
      if (existingDept) {
        return res.status(400).json({ error: 'Department name already exists' });
      }
    }
    
    const dept = await Department.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
   
    const Employee = require('../models/Employee');
    const employeesCount = await Employee.countDocuments({ department: req.params.id });
    
    if (employeesCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete department with ${employeesCount} employee(s) assigned` 
      });
    }
    
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;