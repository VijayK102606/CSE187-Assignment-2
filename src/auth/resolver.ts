/*
#######################################################################
#
# Copyright (C) 2022-2025 David C. Harrison. All right reserved.
#
# You may not use, distribute, publish, or modify this code without 
# the express written permission of the copyright holder.
#
#######################################################################
*/

import { Resolver, Query, Args, Mutation, Arg } from "type-graphql"
import { Authenticated, Credentials, CurrentMember, NewMember } from "./schema"
import { AuthService } from "./service"

// Change this to the signature from the example
@Resolver()
export class AuthResolver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Query(returns => Authenticated)
  async login(
    @Args() credentials: Credentials,
  ): Promise<Authenticated> {
    return new AuthService().login(credentials)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Mutation(returns => CurrentMember)
  async signup(
    @Arg("input") account: NewMember,
  ): Promise<CurrentMember> {
    return new AuthService().signup(account)
  }
}