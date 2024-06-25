
const asyncHandler = require('express-async-handler')
const user = require('../models/user.js')
const note = require('../models/note.js')
const bcrypt = require('bcrypt')

const getAllUsers = asyncHandler(async (req , res) => {
    const allUsers = await user.find().select('-password').lean()
    if(!allUsers){
        return res.status(400).json({mssg : 'no users found'})
    }
    res.status(200).json(allUsers)
})

const createNewUser = asyncHandler(async (req , res) => {
    const {username , password , roles} = req.body

    if(!username || !password || !Array.isArray(roles) || roles.length === 0){
       return res.status(400).json({mssg : 'all fields are necessary'})
    }

    const duplicate = await user.findOne({username}).lean().exec()
    if(duplicate){
       return res.status(409).json({mssg : 'username already exists'})
    }

    // encrypt the password

    const hashedpwd = await bcrypt.hash(password , 10)

    const userObj = {username , "password" : hashedpwd , roles}

    const result = await user.create(userObj)
   
    if(result){
        return res.status(201).json({msg : 'record uploaded successfully'})
    } 
    res.status(400).json({msg : 'uncaught error'})
})


const updateUser = asyncHandler(async(req , res)=>{
    const { id , username , roles , active , password } = req.body
    // console.log(id + username + roles + active + password)
    if(!username || !id || !Array.isArray(roles) || roles.length===0 || typeof active !== 'boolean'){
        return res.status(400).json({msg : 'all fields except password are required'})
    }

    const record = await user.findById(id).exec()

    if (!record) {
        return res.status(400).json({ message: 'User not found' })
    }


    const duplicate = await user.findOne({username}).lean().exec()

    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({msg : 'some duplicate exists'})
    }

    record.username = username
    record.roles = roles
    record.active = active
    
    if(password){
        const hashed_pwd = await bcrypt.hash(password , 10)
        record.password = hashed_pwd;    
    }
    const newuser = await record.save()

    res.status(200).json({msg : `updated user ${newuser}`})
})


const deleteUser = asyncHandler(async(req , res) => {
    const {id} = req.body
    
    if(!id){
        return res.status(400).json({msg : ' requested record not found'})
    }

    const notes = await note.findOne({user : id}).lean().exec()
    console.log(notes)

    if(notes){
        return res.status(400).json({msg : ' employee working on a note'})
    }

    const record = await user.findById(id).exec()

    const result = await record.deleteOne()

    res.status(200).json({msg : `record ${result.username} has been deleted`})
})

module.exports = {getAllUsers , updateUser , createNewUser , deleteUser }
