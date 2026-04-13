import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { Member, MemberId } from "../member/schema";
import { Request } from "express";
import { AuthService } from "../auth/service";
import { FriendService } from "./service";


@Resolver()
export class FriendResolver {
  @Authorized("member")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Mutation(Returns => Member)
  async removeFriend(
    @Ctx() request: Request,
    @Arg("input") input: MemberId
  ): Promise<Member> {
    const friendId = new AuthService().decodeMidt(input.id);
    const member = await new FriendService().delete(request.user.id, friendId);
    member.id = new AuthService().createMidt(member.id);
    return member;
  }

  @Authorized("member")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Query(Returns => [Member])
  async friend(
    @Ctx() request: Request
  ): Promise<Member[]> {
    const auth = new AuthService();
    const members = await new FriendService().get(request.user.id);
    for (const member of members) {
      member.id = auth.createMidt(member.id);
    }
    return members;
  }
}
