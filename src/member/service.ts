import { CurrentMember } from "../auth/schema";
import { pool } from "../db";
import { Member } from "./schema";

export async function exists(memberId: string): Promise<boolean> {
  const forUserById = {
    text: `
      SELECT 1 FROM member
      WHERE id = $1
      AND (data->>'is_active')::boolean = true
    `,
    values: [memberId]
  };

  const {rows} = await pool.query(forUserById);
  return rows.length > 0;
}

export async function existsByEmail(memberEmail: string): Promise<boolean> {
  const forUserByEmail = {
    text: `
      SELECT 1 FROM member
      WHERE data->>'email' = $1
      AND (data->>'is_active')::boolean = true
    `,
    values: [memberEmail]
  }
  const {rows} = await pool.query(forUserByEmail);
  return rows.length > 0;
}

export class MemberService {
  public async get(memberId: string): Promise<Member[]> {
    const forMembers = {
      text: `
        SELECT id, data->>'name' AS name
        FROM member
        WHERE data->>'roles' LIKE '%member%'
        AND id != $1
        AND (data->>'is_active')::boolean = true
        ORDER BY data->>'name' ASC
      `,
      values: [memberId]
    };
    const {rows} = await pool.query(forMembers);
    return rows;
  }

  public async delete(memberEmail: string): Promise<CurrentMember> {
    if (!(await existsByEmail(memberEmail))) {
      throw new Error('Member does not exist or has already been removed');
    }

    const deleteUser = {
      text: `
        UPDATE member
        SET data = data || '{"is_active": false}'::jsonb
        WHERE data->>'email' = $1
        RETURNING data->>'email' AS email, data->>'name' AS name;
      `,
      values: [memberEmail]
    };
    const {rows: members} = await pool.query(deleteUser);
    return members[0];
  }
}
