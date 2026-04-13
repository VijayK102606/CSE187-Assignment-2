import { Credentials, NewMember } from "../src/auth/schema"
import {NewPost} from "../src/post/schema"
import { Test} from "supertest"
import TestAgent from "supertest/lib/agent"

export const anna = {
  email: 'anna@books.com',
  password: 'annaadmin',
}

export const tommy = {
  email: "tommy@books.com",
  password: "tommytimekeeper",
  name: "Tommy Timekeeper",
}

export const timmy = {
  email: "timmy@books.com",
  password: "timmyteaboy",
  name: "Timmy Teaboy",
}

export const terry = {
  email: "terry@books.com",
  password: "terrytroublemaker",
  name: "Terry Troublemaker",
}

export const simon = {
  email: "simon@books.com",
  password: "simon",
  name: "simon"
}

export const wrong = {
  email: 'molly@books.com',
  password: 'notmollyspasswd',
}

export const bad = {
  email: 'molly_at_books.com',
  password: 'mollymember',
  name: 'bad_name'
}

export const postOne = {
  content: 'Post 1',
  image: 'http://example.com'
}

export const postBad = {
  content: 'Post Bad',
  image: 'not-a-url'
}

export const postNoImage = {
  content: 'Just a post'
}

export const postTwo = {
  content: 'Post 2',
  image: 'http://example.com'
}

export async function asTommy(request: TestAgent<Test>): Promise<string|undefined> {
  return login(request, tommy)
}

export async function asAnna(request: TestAgent<Test>): Promise<string|undefined> {
  return login(request, anna)
}

export async function asTimmy(request: TestAgent<Test>): Promise<string|undefined> {
  return login(request, timmy)
}

export async function asTerry(request: TestAgent<Test>): Promise<string|undefined> {
  return login(request, terry)
}

export async function asSimon(request: TestAgent<Test>): Promise<string|undefined> {
  return login(request, simon)
}


export async function login(
  request: TestAgent<Test>,
  member: Credentials
): Promise<string | undefined> {
  const res = await request
    .post('/graphql')
    .send({
      query: `
        query Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            authToken
          }
        }
      `,
      variables: {
        email: member.email,
        password: member.password
      }
    })
    .expect(200);

  return res.body.data.login.authToken;
}


export async function signup(
  request: TestAgent<Test>,
  member: NewMember
) {
  const res = await request
    .post('/graphql')
    .send({
      query: `
        mutation Signup($input: NewMember!) {
          signup(input: $input) {
            email
            name
          }
        }
      `,
      variables: {
        input: member
      }
    });

  return res;
}


export async function makePost(
  request: TestAgent<Test>,
  newPost: NewPost,
  token: string | undefined
) {
  const res = await request
    .post('/graphql')
    .set('Authorization', 'Bearer ' + token)
    .send({
      query: `
        mutation MakePost($input: NewPost!) {
          makePost(input: $input) {
            id
            member
            posted
            content
            image
          }
        }
      `,
      variables: {
        input: newPost
      }
    });

  return res;
}

export async function seesPosts(
  request: TestAgent<Test>,
  page: number,
  token: string | undefined,
  size?: number
) {
  const res = await request
    .post('/graphql')
    .set('Authorization', 'Bearer ' + token)
    .send({
      query: `
        query GetPosts($page: Int!, $size: Int) {
          post(page: $page, size: $size) {
            id
            member
            posted
            content
            image
          }
        }
      `,
      variables: {
        page,
        size
      }
    })
    .expect(200);

  return res;
}

export async function makeRequest(request: TestAgent<Test>, token: string | undefined, memberId: string) {
  const res = await request
    .post('/graphql')
    .set('Authorization', 'Bearer ' + token)
    .send({
      query: `mutation {
        makeRequest(input: {
          id: "${memberId}"
        }) {
          id
          name
        }
      }`
    })
    .expect(200);
  return res;
}

export async function acceptRequest(request: TestAgent<Test>, token: string | undefined, memberId: string) {
  const res = await request
    .post('/graphql')
    .set('Authorization', 'Bearer ' + token)
    .send({
      query: `mutation {
        acceptRequest(input: {
          id: "${memberId}"
        }) {
          id
          name
        }
      }`
    })
    .expect(200)
  return res;
}

export async function requests(request: TestAgent<Test>, token: string | undefined) {
  const res = await request
    .post('/graphql')
    .set('Authorization', 'Bearer ' + token)
    .send({
      query: `{
        request {
          inbound {
            id
            name
          }
          outbound {
            id
            name
          }
        }
      }`
    })
    return res;
}

export async function deleteFriend(request: TestAgent<Test>, token: string | undefined, memberId: string) {
  const res = await request
    .post('/graphql')
    .set('Authorization', 'Bearer ' + token)
    .send({
      query: `
        mutation {
          removeFriend(input: {
            id: "${memberId}"
          }) {
            name
            id
          }
        }
      `
    });
  return res;
}

export async function friendsOf(request: TestAgent<Test>, token: string | undefined) {
  const res = await request
    .post('/graphql')
    .set('Authorization', 'Bearer ' + token)
    .send({
      query: `
        {
          friend {
            id
            name
          }
        }
      `
    });
  return res;
}

export async function membersOtherThan(request: TestAgent<Test>, token: string | undefined) {
  const res = await request
    .post('/graphql')
    .set('Authorization', 'Bearer ' + token)
    .send({
      query: `
        {
          member {
            id
            name
          }
        }
      `
    });
  return res;
}

export async function deleteMember(request: TestAgent<Test>, token: string | undefined, memberEmail: string) {
  const res = await request
    .post('/graphql')
    .set('Authorization', 'Bearer ' + token)
    .send({query: `
        mutation {removeMember(input: {
          email: "${memberEmail}"
        }) {
          name
          email  
        }}
      `
    })
  return res;
}

export async function rejectRequest(request: TestAgent<Test>, token: string | undefined, memberId: string) {
  const res = await request
    .post('/graphql')
    .set('Authorization', 'Bearer ' + token)
    .send({query: `
      mutation {
        rejectRequest(input: {
          id: "${memberId}"
        }) {
          id
          name
        }
      }`
    })
  return res;
}

export async function removeFriend(request: TestAgent<Test>, token: string | undefined, memberId: string) {
  const res = await request
    .post('/graphql')
    .set('Authorization', 'Bearer ' + token)
    .send({query: `
      mutation {
        removeFriend(input: {
          id: "${memberId}"
        }) {
          id
          name  
        }
      }
    `})
  return res;
}
