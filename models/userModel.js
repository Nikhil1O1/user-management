const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Let me know your name'],
        minlength: [10, 'A name must have at least 10 char'],
        validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        validator: [validator.isEmail],
        required: [true, 'Your Email Id is required']
      },
      password: {
        type: String,
        required: [true, 'Password is requried'],
        timestamps: true,
        minlength: 8,
        select: false
      },
      passwordConfirm: {
        type: String,
        required: [true, 'Password is requried'],
        validate: {
            //this works only on save & create, [save/create is called in controller]
            validator: function(el) {
                return el === this.password;
            },
            message: 'password should be same!'
        }
    },

    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
    next();
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
  
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
  
      console.log({resetToken}, this.passwordResetToken);
  
    this.passwordResetExpires = Date.now() + 10*60*1000;//10 mins
  
    return resetToken;
  
  }
const User = mongoose.model('User', userSchema);

module.exports = User;