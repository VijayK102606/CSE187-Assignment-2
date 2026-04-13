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

import { Field, ObjectType, ArgsType, InputType } from "type-graphql"
import { Length, IsEmail } from "class-validator"

@ArgsType()
export class Credentials {
  @Field()
  @IsEmail()
  email!: string
  @Field()
  @Length(4, 32)
  password!: string
}

@ObjectType()
export class Authenticated {
  constructor(name: string, authToken: string) {
    this.name = name
    this.authToken = authToken
  }
  @Field()
  authToken!: string
  @Field()
  name!: string
} 

@InputType()
export class NewMember {
  @Field()
  @IsEmail()
  email!: string
  @Field()
  @Length(4, 32)
  password!: string
  @Field()
  name!: string
}

@ObjectType()
export class CurrentMember {
  @Field()
  email!: string
  @Field()
  name!: string
}

