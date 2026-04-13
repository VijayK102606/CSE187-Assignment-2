/*
#######################################################################
#
# Copyright (C) 2022-2026 David C. Harrison. All right reserved.
#
# You may not use, distribute, publish, or modify this code without 
# the express written permission of the copyright holder.
#
#######################################################################
*/

import { AuthChecker } from "type-graphql"
import { Request } from "express"

import { AuthService } from "./service"

export const expressAuthChecker: AuthChecker<Request> = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { root, args, context, info }, roles,) => 
{
  try {
    context.user = await new AuthService().check(context.headers.authorization, roles)
  } catch {
    return false
  }
  return true
}