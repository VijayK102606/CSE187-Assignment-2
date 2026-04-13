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

import {test, beforeAll, afterAll, expect, describe} from 'vitest';
import * as http from 'http'
import { asAnna, signup, tommy,
  timmy, terry, makePost, asTommy, postOne, postTwo, seesPosts,
  asTimmy,
  makeRequest,
  bad,
  wrong,
  acceptRequest,
  requests,
  asTerry,
  deleteFriend,
  friendsOf,
  membersOtherThan,
  deleteMember,
  rejectRequest,
  asSimon,
  simon,
  removeFriend} from './setup';
import supertest from 'supertest';
import * as jwt from 'jsonwebtoken';

import * as db from './db'
import { app, bootstrap } from '../src/app'
import { encrypt } from '../src/auth/service';

let server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
let tommyId: string;
let timmyId: string;
let terryId: string;

beforeAll( async () => {
  server = http.createServer(app)
  server.listen()
  await db.reset()
  await bootstrap()
})

afterAll(() => {
  db.shutdown()
  server.close()
})

describe('Basic', () => {
  test('Anna Login', async () => {
    const token = await asAnna(supertest(server))
    expect(token).toBeDefined();
  });

  test('Tommy, Timmy, and Terry signup', async () =>  {
    const res = await signup(supertest(server), tommy);
    await signup(supertest(server), timmy);
    await signup(supertest(server), terry);

    const name = res.body.data.signup.name;
    const email = res.body.data.signup.email;
    expect({name: name, email: email}).toEqual({name: tommy.name, email: tommy.email});
  });

  test('Tommy makes two posts', async () => {
    const serve = supertest(server);
    const token = await asTommy(serve);

    await makePost(serve, postOne, token);
    const res = await makePost(serve, postTwo, token);

    expect(res).toBeDefined();
    expect(res.body).toBeDefined();
    expect(res.body.data.makePost).toBeDefined();
    expect(res.body.data.makePost.id).toBeDefined();
    expect(res.body.data.makePost.member).toBeDefined();
    expect(res.body.data.makePost.content).toEqual(postTwo.content);
    expect(res.body.data.makePost.posted).toBeDefined();
    expect(res.body.data.makePost.image).toEqual(postTwo.image);

    tommyId = res.body.data.makePost.member;
  });

  test('Tommy sees his posts', async () => {
    const serve = supertest(server);
    const token = await asTommy(serve);
    const res = await seesPosts(serve, 1, token, 5);
    expect(res.body.data.post.length).toEqual(2);
  });

  test('Timmy does not see Tommy\'s posts', async () => {
    const serve = supertest(server);
    const token = await asTimmy(serve);
    const res = await seesPosts(serve, 1, token, 5);
    expect(res.body.data.post.length).toEqual(0);
  });

  test('Timmy sends Tommy a friend request', async () => {
    const serve = supertest(server);
    const token = await asTimmy(serve);
    const res = await makeRequest(serve, token, tommyId);

    expect(res.body.data.makeRequest.id).toBeDefined();
    expect(res.body.data.makeRequest.name).toBeDefined();
  });

  test('Timmy cannot send another friend request to Tommy', async () => {
    const token = await asTimmy(supertest(server));
    const res = await makeRequest(supertest(server), token, tommyId);
    expect(res.body.errors[0].message).toEqual('A Request to Member has already been made');
  });

  test('Tommy can\'t see Timmy\'s posts until he accepts', async () => {
    const serve = supertest(server);
    const timmyToken = await asTimmy(serve);
    const newPost = await makePost(serve, postOne, timmyToken);

    const tommyToken = await asTommy(serve);
    const res = await seesPosts(serve, 1, tommyToken);

    expect(res.body.data.post.length).toEqual(2);
    timmyId = newPost.body.data.makePost.member;
  });

  test('Timmy has one outbound and no inbound requests', async () => {
    const serve = supertest(server);
    const token = await asTimmy(serve);
    const res = await requests(serve, token);

    expect(res.body.data.request.inbound.length).toEqual(0);
    expect(res.body.data.request.outbound.length).toEqual(1);
  });

  test('Tommy has one inbound and no outbound requests' , async () => {
    const serve = supertest(server);
    const token = await asTommy(serve);
    const res = await requests(serve, token);

    expect(res.body.data.request.inbound.length).toEqual(1);
    expect(res.body.data.request.outbound.length).toEqual(0);
  });

  test('Tommy accepts Timmy\'s friend request', async () => {
    const serve = supertest(server);
    const tommyToken = await asTommy(serve);

    const res = await acceptRequest(serve, tommyToken, timmyId);

    expect(res.body.data.acceptRequest.id).toBeDefined();
    expect(res.body.data.acceptRequest.name).toBeDefined();
  });

  test('Timmy and Tommy are already friends', async () => {
    const token = await asTimmy(supertest(server));
    const res = await makeRequest(supertest(server), token, tommyId);
    expect(res.body.errors[0].message).toEqual('Member is already a Friend');
  });

  test('Tommy is friends with Timmy', async () => {
    const serve = supertest(server);
    const token = await asTommy(serve);
    const res = await friendsOf(serve, token);
    expect(res.body.data.friend.length).toEqual(1);
  });

  test('Timmy and Tommy have no requests', async () => {
    const serve = supertest(server);
    const tommyToken = await asTimmy(serve);
    const tommyRes = await requests(serve, tommyToken);

    expect(tommyRes.body.data.request.inbound.length).toEqual(0);
    expect(tommyRes.body.data.request.outbound.length).toEqual(0);

    const timmyToken = await asTommy(serve);
    const timmyRes = await requests(serve, timmyToken);

    expect(timmyRes.body.data.request.inbound.length).toEqual(0);
    expect(timmyRes.body.data.request.outbound.length).toEqual(0);
  });

  test('Timmy can see Tommy\'s posts and his own', async () => {
    const serve = supertest(server);
    const tommyToken = await asTimmy(serve);
    const res = await seesPosts(serve, 1, tommyToken);
    expect(res.body.data.post.length).toEqual(3);
  });

  test('Tommy can see Timmy\'s posts and his own', async () => {
    const tommyToken = await asTimmy(supertest(server));
    const res = await seesPosts(supertest(server), 1, tommyToken);
    expect(res.body.data.post.length).toEqual(3);
  });

  test('Terry cannot see Tommy or Timmy\'s posts', async () => {
    const serve = supertest(server);
    const token = await asTerry(serve);
    const res = await seesPosts(serve, 1, token);
    expect(res.body.data.post.length).toEqual(0);
  });

  test('Timmy no longer wants tommy as a friend', async () => {
    const serve = supertest(server);
    const token = await asTimmy(serve);
    const res = await deleteFriend(serve, token, tommyId);
    expect(res.body.data.removeFriend.name).toBeDefined();
    expect(res.body.data.removeFriend.id).toBeDefined();
  });


  test('Tommy and Timmy only see their own posts', async () => {
    const serve = supertest(server);
    const token = await asTommy(serve);
    const res = await seesPosts(serve, 1, token);
    expect(res.body.data.post.length).toEqual(2);

    const timmyToken = await asTimmy(serve);
    const timmyRes = await seesPosts(serve, 1, timmyToken);
    expect(timmyRes.body.data.post.length).toEqual(1);
  });

  test('Tommy can see that Timmy and Terry are members', async () => {
    const serve = supertest(server);
    const token = await asTommy(serve);
    const res = await membersOtherThan(serve, token);
    expect(res.body.data.member.length).toEqual(2);
  });

  test('Anna deletes Timmy', async () => {
    const serve = supertest(server);
    const token = await asAnna(serve);
    const res = await deleteMember(serve, token, timmy.email);
    expect(res.body.data.removeMember.email).toBeDefined();
    expect(res.body.data.removeMember.name).toBeDefined();
  });

  test('Tommy tries to remove Timmy as a friend', async () => {
    const serve = supertest(server);
    const token = await asTommy(serve);
    const res = await deleteFriend(serve, token, timmyId);
    expect(res.body.errors[0].message).toEqual('Member does not exist');
  });

  test('Tommy can see only Terry', async () => {
    const token = await asTommy(supertest(server));
    const res = await membersOtherThan(supertest(server), token);
    expect(res.body.data.member.length).toEqual(1);
  });

  test('Tommy cannot request Timmy as a friend', async () => {
    const serve = supertest(server);
    const token = await asTommy(supertest(server));
    const res = await makeRequest(serve, token, timmyId);

    expect(res.body.errors[0].message).toEqual('Member does not exist');
  });

  test('Timmy\'s posts are not visible to Tommy', async () => {
    const serve = supertest(server);
    const token = await asTommy(supertest(server));
    const res = await seesPosts(serve, 1, token);
    expect(res.body.data.post.length).toEqual(2);
  });

  test('Timmy cannot login', async () => {
    const res = await supertest(server)
    .post('/graphql')
    .send({query: `
        query Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {authToken}}
      `,
      variables: {
        email: timmy.email,
        password: timmy.password
      }
    })
    expect(res.body.errors[0].message).toEqual('Your account has been deactivated');
  });

  test('Remove Timmy again', async () => {
    const serve = supertest(server);
    const token = await asAnna(serve);
    const res = await deleteMember(serve, token, timmy.email);

    expect(res.body.errors[0].message).toEqual('Member does not exist or has already been removed');
  });

  test('Terry make a post', async () => {
    const serve = supertest(server);
    const token = await asTerry(serve);
    const res = await makePost(serve, {content: 'new-content', image: 'example.com'}, token);
    expect(res.body.data.makePost.member).toBeDefined();
    terryId = res.body.data.makePost.member;
  });

  test('Terry tries to accept Tommy\'s friend request', async () => {
    const serve = supertest(server);
    const token = await asTerry(serve);
    const res = await acceptRequest(serve, token, tommyId);
    expect(res.body.errors[0].message).toEqual('Member did not send a Request');
  });

  test('Tommy tries to reject Terry\'s request', async () => {
    const serve = supertest(server);
    const token = await asTommy(serve);
    const res = await rejectRequest(serve, token, terryId);
    expect(res.body.errors[0].message).toEqual('Member did not receive a Request');
  });

  test('Terry sends Tommy a friend request', async () =>{
    const serve = supertest(server);
    const token = await asTerry(serve);
    const res = await makeRequest(serve, token, tommyId)
    expect(res.body.data.makeRequest.id).toBeDefined();
  });

  test('Tommy cannot send Terry a friend request', async () => {
    const serve = supertest(server);
    const token = await asTommy(serve);
    const res = await makeRequest(serve, token, terryId)

    expect(res.body.errors[0].message).toEqual('Member has sent a Request to the logged in Member');
  });

  test('Anna deletes Terry so Tommy cannot accept Terry\'s request', async () => {
    const serve = supertest(server);
    const token = await asAnna(serve);
    await deleteMember(serve, token, terry.email);

    const tommyToken = await asTommy(serve);
    const resAccept = await acceptRequest(serve, tommyToken, terryId);
    expect(resAccept.body.errors[0].message).toEqual('Member does not exist');
  });

  test('Tommy tries to reject Terry', async () => {
    const serve = supertest(server);
    const tommyToken = await asTommy(serve);
    const resAccept = await rejectRequest(serve, tommyToken, terryId);

    expect(resAccept.body.errors[0].message).toEqual('Member does not exist');
  });

  test('Tommy rejects Simon', async () => {
    const serve = supertest(server);

    await signup(serve, simon);
    const token = await asSimon(serve);
    await makeRequest(serve, token, tommyId);

    const tommyToken = await asTommy(serve);
    const res = await requests(serve, tommyToken);
    const simonId = res.body.data.request.inbound[0].id;

    const rejectRes = await rejectRequest(serve, tommyToken, simonId);
    expect(rejectRes.body.data.rejectRequest.id).toBeDefined();
    expect(rejectRes.body.data.rejectRequest.name).toBeDefined();
  });

  test('Simon tries to remove Tommy as Friend', async () => {
    const serve = supertest(server);
    const token = await asSimon(serve);
    const res = await removeFriend(serve, token, tommyId);

    expect(res.body.errors[0].message).toEqual('Member is not a Friend');
  });

  test('Simon creates a post without an iamge', async () => {
    const serve = supertest(server);
    const token = await asSimon(serve);
    const res = await makePost(serve, {content: 'some content'}, token);

    expect(res.body.data.makePost.image).toBeNull();
  });
});

describe('login', () => {
  test('Wrong Email Fromat', async () => {
    const member = bad;
    const res = await supertest(server)
      .post('/graphql')
      .send({query: `{login(email: "${member.email}" password: 
        "${member.password}") { name, authToken }}`})
    expect(res.body.data).toBeNull();
  });

  test('Wrong Credentials', async () => {
    const member = wrong;
    await supertest(server)
      .post('/graphql')
      .send({query: `{login(email: "${member.email}" password: 
        "${member.password}") { name, authToken }}`})
      .then((res) => {
        expect(res.body.errors[0].message).toEqual('Unauthorized');
      });
  });
});

describe('signup', () => {
  test('Bad email format', async () => {
    const res = await signup(supertest(server), bad);
    expect(res.body.data).toBeNull();
  });
  test('Email in Use', async () => {
    const serve = supertest(server);
    const res = await signup(serve, tommy)
    expect(res.body.errors[0].message).toEqual('Email already in use');
  });
});

describe('auth', () => {
  test('Corrupt JWT', async () => {
    let authToken = await asSimon(supertest(server))
    authToken = authToken?.slice(0, -1) + '!'
    await supertest(server)
      .post('/graphql')
      .set('Authorization', 'Bearer ' + authToken)
      .send({query: `
        mutation {
          removeFriend(input: {
            id: "${tommyId}"
          }) {
            id
            name  
          }
        }
      `})
      .then((res) => {
        expect(res.body.errors.length).toEqual(1)
      })
  });

  test('No Auth header', async () => {
    await supertest(server)
      .post('/graphql')
      .send({query: `
        mutation {
          removeFriend(input: {
            id: "${tommyId}"
          }) {
            id
            name  
          }
        }
      `})
      .then((res) => {
        expect(res.body.errors.length).toEqual(1)
      })
  })

  test('Anna tries to remove friend', async () => {
    const serve = supertest(server);
    const token = await asAnna(serve);
    const res = await removeFriend(serve, token, timmyId)
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
  
  test('User is not valid', async () => {
    const serve = supertest(server);
    const id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const payload = encrypt(JSON.stringify({id: id}));
    const authToken = jwt.sign(payload, process.env.SECRET as string, {
      expiresIn: '30m',
      algorithm: 'HS256',
    });
    await requests(serve, authToken);
  });
});
