import {Field, ObjectType} from "type-graphql"
import { Member } from "../member/schema"


@ObjectType()
export class Requests {
  @Field(() => [Member])
  inbound!: Member[]

  @Field(() => [Member])
  outbound!: Member[]
}
