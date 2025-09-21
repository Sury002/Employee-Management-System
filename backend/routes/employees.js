const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");

// ✅ Create employee
router.post("/", async (req, res) => {
  try {
    const existingEmployee = await Employee.findOne({
      $or: [{ email: req.body.email }, { employeeId: req.body.employeeId }],
    });

    if (existingEmployee) {
      return res.status(400).json({
        error:
          existingEmployee.email === req.body.email
            ? "Email already exists"
            : "Employee ID already exists",
      });
    }

    const emp = new Employee(req.body);
    await emp.save();
    const populated = await emp.populate("department");
    res.status(201).json(populated);
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ error: errors.join(", ") });
    }
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// ✅ List employees with search, pagination, and department filter
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const q = req.query.q ? String(req.query.q).trim() : "";
    let sortField = req.query.sortField || "createdAt";
    const sortDir = req.query.sortDir === "asc" ? 1 : -1;

    // Build the base match stage for search
    let matchStage = {};
    
    // Age search logic
    if (q && !isNaN(q)) {
      const age = parseInt(q);
      if (age >= 0 && age <= 100) {
        const today = new Date();
        const birthYear = today.getFullYear() - age;
        const startDate = new Date(birthYear - 1, 11, 31); // End of previous year
        const endDate = new Date(birthYear, 11, 31); // End of target year
        
        matchStage.dob = { 
          $gte: startDate, 
          $lte: endDate 
        };
      }
    }

    // Text search 
    if (q && (isNaN(q) || Object.keys(matchStage).length === 0)) {
      const regex = new RegExp(q, "i");
      matchStage.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { role: regex },
        { employeeId: regex },
        { "department.name": regex },
      ];
    }

    // Build pipeline
    const pipeline = [
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
    ];

    // Add match stage if search criteria exist
    if (Object.keys(matchStage).length > 0) {
      pipeline.unshift({ $match: matchStage });
    }

    // Count total
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Employee.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Handle department sorting - use the populated field name
    let sortStage = {};
    if (sortField === "department") {
      sortStage["department.name"] = sortDir;
    } else {
      sortStage[sortField] = sortDir;
    }

    // Sort + paginate
    pipeline.push({ $sort: sortStage });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const employees = await Employee.aggregate(pipeline);

    res.json({
      data: employees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ✅ Get single employee
router.get("/:id", async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id)
      .populate("department")
      .lean();

    if (!emp) return res.status(404).json({ error: "Employee not found" });
    res.json(emp);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid employee ID" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Update employee
router.put("/:id", async (req, res) => {
  try {
    if (req.body.email || req.body.employeeId) {
      const existingEmployee = await Employee.findOne({
        $and: [
          { _id: { $ne: req.params.id } },
          {
            $or: [
              { email: req.body.email },
              { employeeId: req.body.employeeId },
            ],
          },
        ],
      });

      if (existingEmployee) {
        return res.status(400).json({
          error:
            existingEmployee.email === req.body.email
              ? "Email already exists for another employee"
              : "Employee ID already exists for another employee",
        });
      }
    }

    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("department");

    if (!emp) return res.status(404).json({ error: "Employee not found" });
    res.json(emp);
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ error: errors.join(", ") });
    }
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// ✅ Delete employee
router.delete("/:id", async (req, res) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
