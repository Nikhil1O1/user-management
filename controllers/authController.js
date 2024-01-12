const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Email = require('./../utils/email');


const signToken = id => {
  return jwt.sign({id}, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
  });
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
      expires: new Date(Date.now()+ process.env.JWT_COOKIE_EXPIRES_IN* 24*60*60*1000),
      httpOnly: true
  }
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  //removes password from output
  user.password = undefined;
  res.status(statusCode).json({
      status: 'success',
      token, 
      data: {
          user
      }
  })
}

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
  
    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }
    next();
  });


exports.forgotPassword =catchAsync(async(req,res,next) => {
    //find email in db on basis of post req
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new AppError('no relevant email found', 404));
    }

    //generate random password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});  //USING THIS OPTION DISALES ALL VALIDATORS AND YOU CAN SEND 
                                                    //DATA WITHOUT ANY CHECK. HERE WE DID THIS TO
                                                    //AVOID SENDING VALID UNAME AND PASS TO MAKE ANY
                                                    //CHANGES TO THE DB
    //send email to user
    
    //req.protocol it returns http or https
    //host returns address and port

    try{
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
        status: 'success',
        message: 'Token mailed!'
    });
    } catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false}); 
        console.log(err);

        return next(
            new AppError('There was error in sending email, try later!'),
            500
        )
    }
});


exports.resetPassword =catchAsync(async(req,res,next) => {
    const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()}
    });

    // 2) If token isn't expired and user is present, set the new password
    if(!user){
        return next(new AppError('Token is invalid or has expired', 400))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    createSendToken(user, 200, res);
});