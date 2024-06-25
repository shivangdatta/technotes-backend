const asyncHandler = require('express-async-handler')
const user = require('../models/user')
const note = require('../models/note')

// create note (anyone)
const createNewNote = asyncHandler(async (req , res) => {
    const {user_id , title , text , completed} = req.body

    console.log(user + title + text + completed)
    if(!user_id || !title || !text || typeof completed !== 'boolean'){
        return res.status(400).json({msg : "Bad request : all fields are required"})
    }

    const exists = await note.findOne({title}).lean().exec()

    if(exists){
        return res.status(400).json({msg : "Bad request record already exists"})
    }

    const userfound = await user.findById(user_id).lean().exec()

    if(!userfound){
        return res.status(400).json({msg : "user id assigned to note doesnt exist"})
    }


    const noteobj = {user_id , title , text , completed}
    
    const result = await note.create(noteobj)

    if(result){
        return res.status(200).json({msg : `record has been uploaded`})
    }
    res.status(400).json({msg : "Uncaught error"})
})


// update note (anyone)
const updateNote = asyncHandler(async (req, res) => {
    const { id, user_id, title, text, completed } = req.body;

    // Validate input
    if (!id || !user_id || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ msg: "All fields are required and 'completed' must be a boolean." });
    }

    // Check if the note exists
    const foundNote = await note.findById(id);
    if (!foundNote) {
        return res.status(404).json({ msg: "Record doesn't exist." });
    }

    // Check for duplicate title in different notes
    const duplicate = await note.findOne({ title, _id: { $ne: id } });
    if (duplicate) {
        return res.status(409).json({ msg: "Duplicate title found." });
    }

    // Check if the user exists
    const userFound = await user.findById(user_id);
    if (!userFound) {
        return res.status(404).json({ msg: "User ID assigned to note doesn't exist." });
    }

    // Update note fields
    foundNote.user_id = user_id;
    foundNote.title = title;
    foundNote.text = text;
    foundNote.completed = completed;

    // Save updated note
    try {
        const updatedNote = await foundNote.save();
        return res.status(200).json({ msg: `Updated record: ${updatedNote.title}` });
    } catch (error) {
        return res.status(500).json({ msg: "Failed to update record.", error: error.message });
    }
});


// getallnotes (anyone)
const getAllNotes = asyncHandler(async(req , res)=>{
    const records = await note.find().lean().exec()
    if(!records){
        return res.status(400).json({msg : "no records to retrieve"})
    }
    res.status(200).json(records)
})


// delete note (only managers and admins)
const deleteNote = asyncHandler(async(req , res) => {
    const {id , title} = req.body

    const result = await user.findById(id).lean().exec()
    
    const positions = result.roles
    const check = false
    positions.map((item , iterator) =>{
        if(item === 'manager' || item === 'admin') check = true
    })

    if(!check){
        return res.status(400).json({msg : "user trying to delete is not managaer or admin"})
    }
    
    const record = await note.findOne({title}).lean().exec()
    const deletedrec = await record.deleteOne()

    if(deletedrec){
        return res.status(200).json({msg : `record deleted : ${deletedrec.title}`})
    }
    res.status(400).json({msg : "unable to delete due to uncaught error"})
})


module.exports = {createNewNote , updateNote , getAllNotes , deleteNote}

