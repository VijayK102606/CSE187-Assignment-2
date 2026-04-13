import { MaxLength, MinLength } from "class-validator";
import { Field, InputType, ObjectType } from "type-graphql";

@ObjectType()
export class Member {
  @Field()
  @MinLength(180)
  @MaxLength(540)
  id!: string

  @Field()
  name!: string
}

@InputType()
export class MemberId {
  @Field()
  @MinLength(180)
  @MaxLength(540)
  id!: string
}
@InputType()
export class MemberEmail {
  @Field()
  email!: string
}