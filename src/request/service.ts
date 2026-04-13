import { Member } from "../member/schema";
import { pool } from "../db";
import { exists as memberExists } from "../member/service";
import { exists as friendshipExists } from "../friend/service";

async function requestSent(memberId: string, reqId: string) {
  const forRequest = {
    text: `
      SELECT 1 from friend
      WHERE receiver = $2
      AND sender = $1
      AND data->>'accepted' = 'false'
    `,
    values: [memberId, reqId]
  }
  const {rows} = await pool.query(forRequest);
  return rows.length > 0;
}

async function requestReceived(memberId: string, reqId: string) {
  const forRequest = {
    text: `
      SELECT 1 from friend
      WHERE receiver = $1
      AND sender = $2
      AND data->>'accepted' = 'false'
    `,
    values: [memberId, reqId]
  }
  const {rows} = await pool.query(forRequest);
  return rows.length > 0;
}

// async function conflict(memberId: string, reqId: string) {
//   const forExistingRelationships = {
//     text: `
//       SELECT 1 FROM friend
//       WHERE (sender, receiver) IN (
//         ($1, $2), 
//         ($2, $1)
//       );
//     `,
//     values: [memberId, reqId]
//   }
//   const {rows} = await pool.query(forExistingRelationships);
//   return rows.length > 0;
// }

async function getUserInfo(reqId: string) {
  const forUserInfo = {
    text: `
      SELECT id, data->>'name' AS name
      FROM member
      WHERE id = $1
    `,
    values: [reqId]
  };
  const {rows: info} = await pool.query(forUserInfo);
  return info[0];
}

export class RequestService {
  public async create(memberId: string, reqId: string): Promise<Member> {
    if (!(await memberExists(reqId))) {
      throw new Error('Member does not exist');
    }
    if (await friendshipExists(memberId, reqId)) {
      throw new Error('Member is already a Friend');
    }
    if (await requestSent(memberId, reqId)) {
      throw new Error('A Request to Member has already been made');
    }
    if (await requestReceived(memberId, reqId)) {
      throw new Error('Member has sent a Request to the logged in Member');
    }

    const friendRequest = {
      text: `
        INSERT INTO friend(sender, receiver, data)
        VALUES ($1, $2, jsonb_build_object('accepted', false::BOOLEAN));
      `,
      values: [memberId, reqId]
    };
    await pool.query(friendRequest);

    const forRequestedUser = {
      text: `
        SELECT id, data->>'name' AS name
        FROM member
        WHERE id = $1
      `,
      values: [reqId]
    };
    const {rows} = await pool.query(forRequestedUser);
    return rows[0];
  }

  public async accept(memberId: string, reqId: string): Promise<Member> {
    if (!(await memberExists(reqId))) {
      throw new Error('Member does not exist');
    }
    if (!(await requestReceived(memberId, reqId))) {
      throw new Error('Member did not send a Request');
    }

    const acceptRequest = {
      text: `
        UPDATE friend
        SET data = jsonb_build_object('accepted', true)
        WHERE sender = $2
        AND receiver = $1
      `,
      values: [memberId, reqId]
    }
    await pool.query(acceptRequest);
    const info = await getUserInfo(reqId);
    return info;
  }

  public async reject(memberId: string, reqId: string) {
    if (!(await memberExists(reqId))) {
      throw new Error('Member does not exist');
    }
    if (!(await requestReceived(memberId, reqId))) {
      throw new Error('Member did not receive a Request');
    }

    const rejectRequest = {
      text: `
        DELETE FROM friend
        WHERE sender = $2
        AND receiver = $1
        AND (data->>'accepted')::boolean = false
      `,
      values: [memberId, reqId]
    }
    await pool.query(rejectRequest);
    return await getUserInfo(reqId);
  }

  public async inbound(userId: string): Promise<Member[]> {
    const forIncomingRequests = {
      text: `
        SELECT m.id AS id, m.data->>'name' AS name
        FROM member m
        JOIN friend f
          ON f.sender = m.id
        WHERE f.receiver = $1
        AND f.data->>'accepted' = 'false'
        AND (m.data->'is_active')::boolean = true;
      `,
      values: [userId]
    }
    const {rows} = await pool.query(forIncomingRequests);
    return rows;
  }

  public async outbound(userId: string): Promise<Member[]> {
    const forOutgoingRequests = {
      text: `
        SELECT m.id AS id, m.data->>'name' AS name
        FROM member m
        JOIN friend f
          ON f.receiver = m.id
        WHERE f.sender = $1
        AND f.data->>'accepted' = 'false'
        AND (m.data->'is_active')::boolean = true;
      `,
      values: [userId]
    }
    const {rows} = await pool.query(forOutgoingRequests);
    return rows;
  }
}