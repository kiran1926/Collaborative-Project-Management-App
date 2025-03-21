const express = require("express");
const router = express.Router();

const Task = require("../models/task.js");
const Project = require("../models/project.js");
const User = require("../models/user.js");

// ============================  Create Task  ============================================
// new task form
router.get("/:projectId/tasks/new", async (req, res) => {
  try {
    const users = await User.find();
    console.log(req.params);
    const projectId = req.params.projectId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.render("tasks/new.ejs", { project, users });
  } catch (error) {
    console.log("Error getting new task form page: ", error);
    res.redirect("/");
  }
});

// create task
router.post("/:projectId/tasks", async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo } = req.body;

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const newTask = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
    });

    project.tasks.push(newTask._id);
    await project.save();
    res.redirect(`/users/${req.session.user._id}/projects/${project._id}`);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================================  Read All Tasks of a project  ==============================================

router.get("/tasks", async (req, res) => {
  try {
    const userId = req.user._id;
    const users = await User.find();

    const allTasks = await Project.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "tasks",
          localField: "tasks",
          foreignField: "_id",
          as: "tasks",
        },
      },
      { $unwind: "$tasks" },
      { $replaceRoot: { newRoot: "$tasks" } },
    ]);

    res.render("tasks/index.ejs", { tasks: allTasks, users });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching tasks");
  }
});

// ===================================  Read Task  =========================================================

router.get("/:projectId/tasks/:taskId", async (req, res) => {
  try {
    const users = await User.find();
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      res.status(404).json({ message: "Project not found" });
    }

    const task = await Task.findById(req.params.taskId).populate("assignedTo");

    if (!task) {
      res.status(404).json({ message: "Task not found" });
    }

    res.render("tasks/show.ejs", { project, task, users });
  } catch (error) {
    console.log("Error showing Task: ", error);
    res.redirect("/");
  }
});

// ==================================  Edit Task  ================================================================

// get edit page
router.get("/:projectId/tasks/:taskId/edit", async (req, res) => {
  try {
    const users = await User.find();
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const projectId = req.params.projectId;

    const project = await Project.findById(projectId);

    await project.populate("teamMembers");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.render("tasks/edit.ejs", {
      project,
      users,
      task,
      teamMembers: project.teamMembers,
    });
  } catch (error) {
    console.log("Error getting edit task form: ", error);
  }
});

// updating the task
router.put("/:projectId/tasks/:taskId", async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const updates = req.body;

    const updatedTask = await Task.findByIdAndUpdate(taskId, updates, {
      new: true,
    });

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.redirect(
      `/users/${req.session.user._id}/projects/${req.params.projectId}`
    );
  } catch (error) {
    console.log("Error updating task: ", error);
  }
});

// ====================================  Delete Task  ========================================================

router.delete("/:projectId/tasks/:taskId", async (req, res) => {
  try {
    const taskId = req.params.taskId;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Project.findByIdAndUpdate(task.projectId, {
      $pull: { tasks: taskId },
    });

    await Task.findByIdAndDelete(taskId);

    res.redirect(
      `/users/${req.session.user._id}/projects/${req.params.projectId}`
    );
  } catch (error) {
    console.log("Error updating task: ", error);
  }
});

// ================================  Search Task  ==========================================================
router.get("/:projectId/tasks/search", async (req, res) => {
  try {
    const query = req.query;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const tasks = await Task.find({
      $and: [
        { _id: { $in: project.tasks } },
        {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      ],
    }).populate("assignedTo", "name email");

    res.render("tasks/index.ejs", { project, tasks });
  } catch (error) {
    console.log("Error searching tasks:", error);
    res.redirect("/");
  }
});

//  ================================ Marking task as complete  ========================================

router.put("/:projectId/tasks/:taskId/complete", async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.status = "Completed";
    await task.save();

    res.redirect(
      `/users/${req.session.user._id}/projects/${req.params.projectId}`
    );
  } catch (error) {
    console.log("Error completing task: ", error);
    res.redirect("/");
  }
});

module.exports = router;
