const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

//import models
const User = require("../models/user.js");
const Project = require("../models/project.js");
const Task = require("../models/task.js");

// routes : (localhost:3000/users/:userId/projects)

/* -----------------   Create : add a new project  ------------------------ */

// new page view : /new
router.get("/new", async(req, res) => {
    try {
        const users = await User.find();
        res.render("projects/new.ejs", {users});
    } catch (error) {
        console.log("Error while showing new project page: ", error);
        res.status(500).json({ message: "Internal Server Error"});
    }
    
});

// POST :  creating new project
router.post("/", async(req, res) => {
    try {
        console.log(req.body);
        // data from new project form
        const { name, description, teamMembers = [] } = req.body;

        console.log(teamMembers);
        // current user
        const currentUser = await User.findById(req.session.user._id);
        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        let teamMembersArray = [];
        if (Array.isArray(teamMembers)) {
            teamMembersArray = teamMembers.filter(id =>  mongoose.Types.ObjectId.isValid(id));
        } else if (typeof teamMembers === "String") {
            teamMembersArray = teamMembers.split(",").map(id => id.trim()).filter(id =>  mongoose.Types.ObjectId.isValid(id));
        }

        // new project 
        const newProject = new Project ({
            name, 
            description,
            owner: currentUser._id,
            teamMembers: teamMembersArray,
        });
        
        await newProject.save();
      
        // res.status(201).json({ message: "Project created successfully", project: newProject });
        res.redirect(`/users/${currentUser._id}/projects`);

    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ message: "Internal Server Error"});
    }
});


/* -----------------   Read : fetch all the projects  ------------------------ */

router.get("/", async(req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please Log In!"});
        }

        const currentUser = await User.findById(req.session.user._id);

        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }
    
        // fetch all projects where current user is member or owner
    const projects = await Project.find({
                                $or: [
                                    { owner: currentUser._id},
                                    { teamMembers: currentUser._id},
                                ]
                            }).populate("owner", "name")
                            .populate("teamMembers");

    res.render("projects/index.ejs", { user: currentUser, projects });

    } catch (error) {
        console.log("Error fetching projects: ", error);
        res.redirect("/");
    }
});


/* -----------------   Read : read the selected project  ------------------------ */

router.get("/:projectId", async(req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please Log In!"});
        }

        const currentUser = await User.findById(req.session.user._id);

        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const projectFound = await Project.findById(req.params.projectId).populate("owner", "name").populate("teamMembers", "name email");

        if (!projectFound) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.render("projects/show.ejs", {project: projectFound, user:currentUser});
        
    } catch (error) {
        console.log("Error getting the project: ", error);
        res.redirect("/");
    }
})

/* -----------------   Update: edit and update the selected project  ------------------------ */

// get edit form
router.get("/:projectId/edit", async(req, res) => {
    try {
        const users = await User.find();
        if (!req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please Log In!"});
        }

        const currentUser = await User.findById(req.session.user._id);

        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const projectFound = await Project.findById(req.params.projectId).populate("owner", "name").populate("teamMembers", "name email");

        if (!projectFound) {
            return res.status(404).json({ message: "Project not found" });
        }
        
        res.render("projects/edit.ejs", { project: projectFound, users });
    } catch (error) {
        console.log("Error getting edit page for the project: ", error);
        res.redirect("/");
    }
})

// updating the edits tothe project
router.put("/:projectId", async(req, res) => {
    try {
        const users = await User.find();
        if (!req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please Log In!"});
        }

        const currentUser = await User.findById(req.session.user._id);

        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const projectFound = await Project.findById(req.params.projectId).populate("owner", "name").populate("teamMembers", "name email");

        if (!projectFound) {
            return res.status(404).json({ message: "Project not found" });
        }
        // update
        let teamMembers = req.body.teamMembers || [];

        if (!Array.isArray(teamMembers)) {
           teamMembers= [teamMembers];
        }
        teamMembers = teamMembers.filter( id => mongoose.Types.ObjectId.isValid(id));

        console.log("Valid TeamMembers to Save:", teamMembers);
    
        //update properties
        projectFound.name = req.body.name;
        projectFound.description = req.body.description;
        projectFound.teamMembers = teamMembers.map( id => new mongoose.Types.ObjectId(id));

        console.log("Mapped Ingredients as ObjectIds:", projectFound.teamMembers);


        await projectFound.save();

        res.redirect(`/users/${req.session.user._id}/projects/${req.params.projectId}`);

    } catch (error) {
        console.log("Error updating the project: ", error);
        res.redirect("/");
    }
});

/* -----------------   Delete: the selected project  ------------------------ */ 
router.delete("/:projectId", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized. Please Log In!" });
    }

    const currentUser = await User.findById(req.session.user._id);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const projectFound = await Project.findById(req.params.projectId)
      .populate("owner")
      .populate("teamMembers");

    if (!projectFound) {
      return res.status(404).json({ message: "Project not found" });
    }

    await projectFound.deleteOne();

    res.redirect(`/users/${req.session.user._id}/projects`);
  } catch (error) {
    console.log("Error deleting the project: ", error);
        res.redirect("/");
  }
});

module.exports = router;