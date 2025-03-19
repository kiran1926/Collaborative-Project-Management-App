
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Not Started", "In Progress", "Completed"],
        default: "Not Started",
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Low",
    },
    dueDate: {
        type: Date,
    },
    // attachments: {
    //     type: String,  // stores file path
    // },
    // projectId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Project",
    //     required: true,
    // },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {timestamp : true});

module.exports = mongoose.model("Task", taskSchema);