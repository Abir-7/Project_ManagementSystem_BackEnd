/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errors/AppError";
import User from "../users/user/user.model";

import { jsonWebToken } from "../../utils/jwt/jwt";

import { UserProfile } from "../users/user_profile/userProfile.model";
import getExpiryTime from "../../utils/helper/getExpiryTime";
import getOtp from "../../utils/helper/getOtp";
import { sendEmail } from "../../utils/sendEmail";
import getHashedPassword from "../../utils/helper/getHashedPassword";
import { appConfig } from "../../config";
import { IUser } from "../users/user/user.interface";
import mongoose from "mongoose";
import { isTimeExpired } from "../../utils/helper/isTimeExpire";
//import { publishJob } from "../../rabbitMq/publisher";
import { TUserRole, userRoles } from "../../interface/auth.interface";
import { SupervisorEmployee } from "../relational_table/employee_supervisor/employee_supervisor.model";

const createUser = async (
  data: {
    email: string;
    fullName: string;
    password: string;
    role: TUserRole;
    phone: string;
  },
  authRole: TUserRole,
  userId: string
): Promise<Partial<IUser>> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const isExist = await User.findOne({ email: data.email }).session(session);

    if (isExist && isExist.isVerified === true) {
      throw new AppError(status.BAD_REQUEST, "User already exist");
    }

    if (isExist && isExist.isVerified === false) {
      await User.findOneAndDelete({ _id: isExist._id }).session(session);
      await UserProfile.findOneAndDelete({ user: isExist._id }).session(
        session
      );
    }

    const hashedPassword = await getHashedPassword(data.password);
    // const otp = getOtp(4);
    // const expDate = getExpiryTime(10);

    if (authRole === userRoles.ADMIN && data.role !== userRoles.SUPERVISOR) {
      throw new AppError(
        status.BAD_REQUEST,
        `ADMIN can only assign the ${userRoles.SUPERVISOR} role`
      );
    }

    if (authRole === userRoles.SUPERVISOR && data.role !== userRoles.EMPLOYEE) {
      throw new AppError(
        status.BAD_REQUEST,
        `SUPERVISOR can only assign the ${userRoles.EMPLOYEE} role`
      );
    }

    const userData = {
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role,
      authentication: { otp: null, expDate: null },
      addedBy: userId,
    };

    const createdUser = await User.create([{ ...userData, isVerified: true }], {
      session,
    });
    const userProfileData = {
      fullName: data.fullName,
      email: createdUser[0].email,
      user: createdUser[0]._id,
      phone: data.phone,
    };

    await UserProfile.create([userProfileData], { session });

    if (data.role === "EMPLOYEE" && authRole === "SUPERVISOR") {
      await SupervisorEmployee.create(
        [{ employee: createdUser[0]._id, present_supervisor: userId }],
        { session }
      );
    }

    // await publishJob("emailQueue", {
    //   to: data.email,
    //   subject: "Email Verification Code",
    //   body: otp.toString(),
    // });

    await session.commitTransaction();
    session.endSession();

    return {
      email: createdUser[0].email,
      isVerified: createdUser[0].isVerified,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const userLogin = async (loginData: {
  email: string;
  password: string;
}): Promise<{ accessToken: string; userData: any; refreshToken: string }> => {
  const userData = await User.findOne({
    email: loginData.email.toLowerCase(),
  }).select("+password");
  if (!userData) {
    throw new AppError(status.BAD_REQUEST, "User not found.");
  }

  if (userData.isVerified === false) {
    throw new AppError(status.BAD_REQUEST, "Please verify your email.");
  }

  const isPassMatch = await userData.comparePassword(loginData.password);

  if (!isPassMatch) {
    throw new AppError(status.BAD_REQUEST, "Please check your password.");
  }

  const jwtPayload = {
    userEmail: userData.email,
    userId: userData._id,
    userRole: userData.role,
  };

  const accessToken = jsonWebToken.generateToken(
    jwtPayload,
    appConfig.jwt.jwt_access_secret as string,
    appConfig.jwt.jwt_access_exprire
  );

  const refreshToken = jsonWebToken.generateToken(
    jwtPayload,
    appConfig.jwt.jwt_refresh_secret as string,
    appConfig.jwt.jwt_refresh_exprire
  );

  return {
    accessToken,
    refreshToken,
    userData: {
      ...userData.toObject(),
      password: null,
    },
  };
};

const verifyUser = async (
  email: string,
  otp: number
): Promise<{
  userId: string | undefined;
  email: string | undefined;
  isVerified: boolean | undefined;
  needToResetPass: boolean | undefined;
  token: string | null;
}> => {
  if (!otp) {
    throw new AppError(status.BAD_REQUEST, "Give the Code. Check your email.");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(status.BAD_REQUEST, "User not found");
  }

  const expirationDate = user.authentication.expDate;

  if (isTimeExpired(expirationDate)) {
    throw new AppError(status.BAD_REQUEST, "Code time expired.");
  }

  if (otp !== user.authentication.otp) {
    throw new AppError(status.BAD_REQUEST, "Code not matched.");
  }

  let updatedUser;
  let token = null;
  if (user.isVerified) {
    token = jsonWebToken.generateToken(
      { userEmail: user.email },
      appConfig.jwt.jwt_access_secret as string,
      "10m"
    );

    const expDate = getExpiryTime(10);

    updatedUser = await User.findOneAndUpdate(
      { email: user.email },
      {
        "authentication.otp": null,
        "authentication.expDate": expDate,
        needToResetPass: true,
        "authentication.token": token,
      },
      { new: true }
    );
  } else {
    updatedUser = await User.findOneAndUpdate(
      { email: user.email },
      {
        "authentication.otp": null,
        "authentication.expDate": null,
        isVerified: true,
      },
      { new: true }
    );
  }

  return {
    userId: updatedUser?._id as string,
    email: updatedUser?.email,
    isVerified: updatedUser?.isVerified,
    needToResetPass: updatedUser?.needToResetPass,
    token: token,
  };
};

const forgotPasswordRequest = async (
  email: string
): Promise<{ email: string }> => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(status.BAD_REQUEST, "Email not found.");
  }

  const otp = getOtp(4);
  const expDate = getExpiryTime(10);

  const data = {
    otp: otp,
    expDate: expDate,
    needToResetPass: false,
    token: null,
  };

  await sendEmail(
    user.email,
    "Reset Password Verification Code",
    `Your code is: ${otp}`
  );

  await User.findOneAndUpdate(
    { email },
    { authentication: data },
    { new: true }
  );

  return { email: user.email };
};

const resetPassword = async (
  token: string,
  userData: {
    new_password: string;
    confirm_password: string;
  }
): Promise<{ email: string }> => {
  const { new_password, confirm_password } = userData;

  if (!token) {
    throw new AppError(
      status.BAD_REQUEST,
      "You are not allowed to reset password."
    );
  }

  const user = await User.findOne({ "authentication.token": token });
  if (!user) {
    throw new AppError(status.BAD_REQUEST, "User not found.");
  }

  const currentDate = new Date();
  const expirationDate = new Date(user.authentication.expDate);

  if (currentDate > expirationDate) {
    throw new AppError(status.BAD_REQUEST, "Token expired.");
  }

  if (new_password !== confirm_password) {
    throw new AppError(
      status.BAD_REQUEST,
      "New password and Confirm password doesn't match!"
    );
  }

  const decode = jsonWebToken.verifyJwt(
    token,
    appConfig.jwt.jwt_access_secret as string
  );

  const hassedPassword = await getHashedPassword(new_password);

  const updateData = await User.findOneAndUpdate(
    { email: decode.userEmail },
    {
      password: hassedPassword,
      authentication: { otp: null, token: null, expDate: null },
      needToResetPass: false,
    },
    { new: true }
  );
  if (!updateData) {
    throw new AppError(
      status.BAD_REQUEST,
      "Failed to reset password. Try again."
    );
  }
  return { email: updateData?.email as string };
};

const getNewAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  if (!refreshToken) {
    throw new AppError(status.UNAUTHORIZED, "Refresh token not found.");
  }
  const decode = jsonWebToken.verifyJwt(
    refreshToken,
    appConfig.jwt.jwt_refresh_secret as string
  );

  // eslint-disable-next-line no-shadow
  const { userEmail, userId, userRole } = decode;

  if (userEmail && userId && userRole) {
    const jwtPayload = {
      userEmail: userEmail,
      userId: userId,
      userRole: userRole,
    };

    const accessToken = jsonWebToken.generateToken(
      jwtPayload,
      appConfig.jwt.jwt_access_secret as string,
      appConfig.jwt.jwt_access_exprire
    );
    return { accessToken };
  } else {
    throw new AppError(status.UNAUTHORIZED, "You are unauthorized.");
  }
};

const updatePassword = async (
  userId: string,
  passData: {
    new_password: string;
    confirm_password: string;
    old_password: string;
  }
): Promise<{ message: string; user: string }> => {
  const { new_password, confirm_password, old_password } = passData;

  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  const isPassMatch = await user.comparePassword(old_password);

  if (!isPassMatch) {
    throw new AppError(status.BAD_REQUEST, "Old password not matched.");
  }

  if (new_password !== confirm_password) {
    throw new AppError(
      status.BAD_REQUEST,
      "New password and Confirm password doesn't match!"
    );
  }

  const hassedPassword = await getHashedPassword(new_password);

  if (!hassedPassword) {
    throw new AppError(
      status.BAD_REQUEST,
      "Failed to update password. Try again."
    );
  }

  user.password = hassedPassword;
  await user.save();

  return { user: user.email, message: "Password successfully updated." };
};

const reSendOtp = async (userEmail: string): Promise<{ message: string }> => {
  const userData = await User.findOne({ email: userEmail });

  if (!userData?.authentication.otp) {
    throw new AppError(500, "Don't find any expired code");
  }

  const OTP = getOtp(4);

  const updateUser = await User.findOneAndUpdate(
    { email: userEmail },
    {
      $set: {
        "authentication.otp": OTP,
        "authentication.expDate": new Date(Date.now() + 10 * 60 * 1000), //10min
      },
    },
    { new: true }
  );

  if (!updateUser) {
    throw new AppError(500, "Failed to Send. Try Again!");
  }

  await sendEmail(userEmail, "Verification Code", `CODE: ${OTP}`);
  return { message: "Verification code send." };
};
export const AuthService = {
  createUser,

  userLogin,
  verifyUser,
  forgotPasswordRequest,
  resetPassword,
  getNewAccessToken,
  updatePassword,
  reSendOtp,
};
