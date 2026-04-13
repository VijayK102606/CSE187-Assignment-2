import { Member } from "../member/schema";
import { pool } from "../db";
import { exists as memberExists } from "../member/service";

export async function exists(memberId: string, reqId: string) {
  const forFriendship = {
    text: `
      SELECT 1
      FROM friend
      WHERE (sender, receiver) IN (
        ($1, $2), 
        ($2, $1)
      )
      AND data->>'accepted' = 'true';
    `,
    values: [memberId, reqId]
  }
  const {rows} = await pool.query(forFriendship);
  return rows.length > 0;
}

export class FriendService {
  public async get(memberId: string): Promise<Member[]> {
    const forFriends = {
      text: `
        SELECT m.id AS id, m.data->>'name' AS name
        FROM member m
        JOIN friend f ON (
          (f.sender = $1 AND f.receiver = m.id)
          OR
          (f.receiver = $1 AND f.sender = m.id)
        )
        WHERE f.data->>'accepted' = 'true'
      `,
      values: [memberId]
    }
    const {rows} = await pool.query(forFriends);
    return rows;
  }

  public async delete(memberId: string, reqId: string): Promise<Member> {
    if (!(await memberExists(reqId))) {
      throw new Error('Member does not exist');
    }
    if (!(await exists(memberId, reqId))) {
      throw new Error('Member is not a Friend')
    }

    const deleteFriendship = {
      text: `
        DELETE FROM friend
        WHERE (sender, receiver) IN (
          ($1, $2), 
          ($2, $1)
        )
        AND data->>'accepted' = 'true';
      `,
      values: [memberId, reqId]
    }
    await pool.query(deleteFriendship);

    const forUser = {
      text: `
        SELECT id, data->>'name' AS name
        FROM member
        WHERE id = $1
      `,
      values: [reqId]
    };
    const {rows} = await pool.query(forUser);
    return rows[0];
  }
}
