import mongoose from "mongoose";

const supplierSchema = mongoose.Schema({
    recordType: {
        type: String,
        enum: ["supplier", "grn"],
        default: "grn"
    },
    supplierId: {
        type: String,
        required: true,
        unique : true
    },
    supplierRefId: {
        type: String,
        required: false
    },
    grnId: {
        type: String,
        required: false
    },
    productId: {
        type: String,
        required: false,
        unique : false
    },
    email: {
        type: String,
        required: true
    },
    Name : {
        type : String,
        required : true
    },
    stock : {
        type : Number,
        required : false,
        default: 0
    },
    cost :{
        type : Number,
        required : false,
        default: 0
    },
    contactNo :{
        type:String,
        required:false
    },
    date : {
        type : Date,
        default : Date.now
    }
});

const Supplier = mongoose.model("suppliers", supplierSchema);

export default Supplier;
