const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`,
        },
    },
    mobile: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid mobile number!`,
        },
    },
    designation: {
        type: String,
        enum: ['HR', 'Manager', 'Sales'],
        required: true,
    },
    gender: {
        type: String,
        enum: ['M', 'F'],
        required: true,
    },
    courses: {
        type: [String],
        enum: ['MCA', 'BCA', 'BSC'],
    },
    image: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /\.(jpg|jpeg|png|gif)$/.test(v);
            },
            message: props => `${props.value} is not a valid image file!`,
        },
    },
}, { timestamps: true });

EmployeeSchema.pre('save', function(next) {
    this.mobile = this.mobile.replace(/[^0-9]/g, ''); 
    if (this.mobile.length !== 10) {
        return next(new Error('Mobile number must be 10 digits.'));
    }
    next();
});

module.exports = mongoose.model("employee", EmployeeSchema);
