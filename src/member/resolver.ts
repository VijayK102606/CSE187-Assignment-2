import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { Request } from "express";
import { AuthService } from "../auth/service";
import { MemberService } from "./service";
import { CurrentMember } from "../auth/schema";
import { MemberEmail, Member } from "./schema";


@Resolver()
export class MemberResolver {
  @Authorized("member")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Query(returns => [Member])
  public async member(
    @Ctx() request: Request
  ): Promise<Member[]> {
    const auth = new AuthService();
    const members = await new MemberService().get(request.user.id);

    for (const member of members) {
      member.id = auth.createMidt(member.id);
    }
    return members;
  }

  @Authorized("admin")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Mutation(returns => CurrentMember)
  public async removeMember(
    @Arg("input") input: MemberEmail
  ): Promise<CurrentMember> {
    const marked = await new MemberService().delete(input.email);
    return marked;
  }
}