import { Authorized, Resolver, Mutation, Arg, Ctx, Query, Args } from "type-graphql";
import { NewPost, Pagination, Post } from "./schema";
import { PostService } from "./service";
import { AuthService } from "../auth/service";
import { Request } from "express";


@Resolver()
export class PostResolver {
  @Authorized("member")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Mutation(returns => Post)
  async makePost(
    @Arg("input") input: NewPost,
    @Ctx() request: Request
  ): Promise<Post> {
    const post = await new PostService().create(request.user.id, input);
    post.member = new AuthService().createMidt(post.member);
    return post
  }

  @Authorized("member")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Query(returns => [Post])
  async post(
    @Args() pagination: Pagination,
    @Ctx() request: Request
  ): Promise<Post[]> {
    if (!pagination.size) {
      pagination.size = 20;
    }
    const posts = await new PostService().get(request.user.id, pagination.page, pagination.size);
    for (const post of posts) {
      post.member = new AuthService().createMidt(post.member);
    }
    return posts;
  }
}