
const express = require("express");
const { noteModel } = require("../model/note.model");
const mongoose = require("mongoose");

const noteRouter = express.Router();

const createNote = async (req, res) => {
  try {
    const { title, content } = req.body || {};
    if (typeof title !== "string" || !title.trim() || typeof content !== "string") {
      return res.status(400).send({ msg: "A title and note content are required." });
    }

    const note = await noteModel.create({
      title: title.trim(),
      content: content.trim(),
      userId: req.userId,
    });

    return res.status(201).send({
      msg: "Note created successfully",
      note,
    });
  } catch (error) {
    console.error("Creating note failed:", error);
    return res.status(500).send({ msg: "Unable to save this note right now." });
  }
};

noteRouter.get("/", async (req, res) => {
  try {
    const notes = await noteModel.find({ userId: req.userId }).sort({ isPinned: -1, updatedAt: -1 });
    return res.send({ notes });
  } catch (error) {
    console.error("Loading notes failed:", error);
    return res.status(500).send({ msg: "Unable to load your notes right now." });
  }
});

noteRouter.post(["/", "/create"], createNote);

noteRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ msg: "Invalid note." });
  }

  const updates = {};
  const { title, content, isPinned } = req.body || {};
  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).send({ msg: "A note title cannot be empty." });
    }
    updates.title = title.trim();
  }
  if (content !== undefined) {
    if (typeof content !== "string") {
      return res.status(400).send({ msg: "Note content must be text." });
    }
    updates.content = content.trim();
  }
  if (isPinned !== undefined) {
    if (typeof isPinned !== "boolean") {
      return res.status(400).send({ msg: "Invalid pinned value." });
    }
    updates.isPinned = isPinned;
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).send({ msg: "There are no changes to save." });
  }

  try {
    const note = await noteModel.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!note) {
      return res.status(404).send({ msg: "Note not found." });
    }
    return res.send({ msg: "Note updated successfully", note });
  } catch (error) {
    console.error("Updating note failed:", error);
    return res.status(500).send({ msg: "Unable to update this note right now." });
  }
});

noteRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ msg: "Invalid note." });
  }

  try {
    const note = await noteModel.findOneAndDelete({ _id: id, userId: req.userId });
    if (!note) {
      return res.status(404).send({ msg: "Note not found." });
    }
    return res.send({ msg: "Note deleted successfully" });
  } catch (error) {
    console.error("Deleting note failed:", error);
    return res.status(500).send({ msg: "Unable to delete this note right now." });
  }
});

module.exports = { noteRouter };
