/* eslint-disable @typescript-eslint/no-unused-vars */
<<<<<<< HEAD
/* eslint-disable @typescript-eslint/no-explicit-any */
=======
>>>>>>> 32b4ee5644374484dc2d6429e2446a836cf9bce1
import { NextFunction, Request, Response } from "express";
import AppError from "../../errors/AppError";
import status from "http-status";
import { TUserRole } from "../../interface/auth.interface";

import { jsonWebToken } from "../../utils/jwt/jwt";
import { appConfig } from "../../config";
import User from "../../modules/users/user/user.model";

export const auth =
  (...userRole: TUserRole[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokenWithBearer = req.headers.authorization as string;

      console.log(tokenWithBearer);

      if (!tokenWithBearer || !tokenWithBearer.startsWith("Bearer")) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }

      const token = tokenWithBearer.split(" ")[1];

      if (token === "null") {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }

      const decodedData = jsonWebToken.verifyJwt(
        token,
        appConfig.jwt.jwt_access_secret as string
      );

      const userData = await User.findById(decodedData.userId);

      if (!userData) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }

      if (userRole.length && !userRole.includes(decodedData.userRole)) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }

      if (
        userData.role !== decodedData.userRole ||
        userData.email !== decodedData.userEmail
      ) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }

      req.user = decodedData;

      return next();
<<<<<<< HEAD
    } catch (error: any) {
=======
    } catch (error) {
>>>>>>> 32b4ee5644374484dc2d6429e2446a836cf9bce1
      return next(
        new AppError(status.UNAUTHORIZED, "Invalid or expired token")
      );
    }
  };
