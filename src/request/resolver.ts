import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { Requests } from "./schema";
import { Member, MemberId } from "../member/schema";
import { Request } from "express";
import { RequestService } from "./service";
import { AuthService } from "../auth/service";


@Resolver()
export class RequestResolver {
  @Authorized("member")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Mutation(returns => Member)
  async makeRequest(
    @Arg("input") input: MemberId,
    @Ctx() request: Request
  ): Promise<Member> {
    const auth = new AuthService();
    const req = new RequestService();

    const memberId = auth.decodeMidt(input.id);
    const reqMember = await req.create(request.user.id, memberId);
    
    reqMember.id = auth.createMidt(reqMember.id);
    return reqMember;
  }

  @Authorized("member")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Mutation(returns => Member)
  async acceptRequest(
    @Arg("input") input: MemberId,
    @Ctx() request: Request
  ): Promise<Member> {
    const memberId = new AuthService().decodeMidt(input.id);
    const newFriend = await new RequestService().accept(request.user.id, memberId);
    
    newFriend.id = new AuthService().createMidt(newFriend.id);
    return newFriend;
  }

  @Authorized("member")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Query(returns => Requests)
  async request(
    @Ctx() request: Request
  ): Promise<Requests> {
    const req = new RequestService();
    const auth = new AuthService();
    const inReqs = await req.inbound(request.user.id);
    const outReqs = await req.outbound(request.user.id);

    for (const req of inReqs) {
      req.id = auth.createMidt(req.id);
    }
    for (const req of outReqs) {
      req.id = auth.createMidt(req.id);
    }

    return {inbound: inReqs, outbound: outReqs};
  }

  @Authorized("member")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Mutation(returns => Member)
  async rejectRequest(
    @Arg("input") input: MemberId,
    @Ctx() request: Request
  ): Promise<Member> {
    const auth = new AuthService();
    const memberId = auth.decodeMidt(input.id);
    const member = await new RequestService().reject(request.user.id, memberId);

    member.id = auth.createMidt(member.id);
    return member;
  }
}