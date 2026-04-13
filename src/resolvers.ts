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

import { AuthResolver } from './auth/resolver'
import { PostResolver } from './post/resolver'
import { RequestResolver } from './request/resolver'
import { FriendResolver } from './friend/resolver'
import { MemberResolver } from './member/resolver'

export const resolvers = [
    AuthResolver,
    PostResolver,
    RequestResolver,
    FriendResolver,
    MemberResolver
] as const