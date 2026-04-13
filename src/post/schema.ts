
import { Field, ObjectType, InputType, ArgsType, Int, ID} from "type-graphql"
import { IsUrl, MinLength, MaxLength, IsUUID, Min, IsInt, IsOptional} from "class-validator"
import { GraphQLISODateTime } from "type-graphql";

@InputType()
export class NewPost {
  @Field()
  content!: string
  @Field({nullable: true})
  @IsUrl()
  image?: string
}

@ObjectType()
export class Post {
  @Field(() => ID)
  @IsUUID(4)
  id!: string

  @Field()
  @MinLength(180)
  @MaxLength(540)
  member!: string

  @Field(() => GraphQLISODateTime)
  posted!: Date;
  
  @Field()
  content!: string

  @Field({nullable: true})
  @IsOptional()
  @IsUrl()
  image?: string
}

@ArgsType()
export class Pagination {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page!: number
  @Field(() => Int, {nullable: true})
  size?: number
}

// const DateTimeISO = new GraphQLScalarType({
//   name: "DateTimeISO",
//   description: "Date object scalar type",
  
//   serialize(value: unknown): string {
//     const date = new Date(value);
//     if (!(value instanceof Date)) {
//       throw new Error()
//     }
//     return new Date(value).toISOString();
//   },
// })