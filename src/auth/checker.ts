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

export const expressAuthChecker: AuthChecker<Request> = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { root, args, context, info }, roles,) => 
{
  throw Error('Not implemented, use the example code')
}