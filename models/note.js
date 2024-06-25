const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)

const noteSchema = new mongoose.Schema(
    {
        user_id : {
            type : mongoose.Schema.Types.ObjectId,
            required : true,
            ref : 'user'
        },
        title : {
            type : String,
            required : true
        },
        text : {
            type : String,
            required : true
        },
        completed : {
            type : Boolean,
            required : true
        }
    },
    {
        timestamps : true
    } 
)

noteSchema.plugin(AutoIncrement , {
    inc_field : 'ticket',
    id : 'ticketNums',
    start_seq : 600
})


module.exports = mongoose.model('note' , noteSchema)