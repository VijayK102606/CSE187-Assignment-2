import { NewPost, Post } from "./schema";
import { pool } from "../db";


export class PostService {
  public async create(userId: string, newPost: NewPost): Promise<Post> {
    const {content, image} = newPost;

    const createPost = {
      text: `
        INSERT INTO post(member, data)
        VALUES (
          $1,
          jsonb_strip_nulls(
            jsonb_build_object(
              'content', $2::text,
              'image', $3::text,
              'posted', NOW()::TIMESTAMPTZ
            )
          )
        )
        RETURNING
        id as id,
        member as member,
        data->>'content' as content,
        data->>'image' as image,
        data->>'posted' as posted;
      `,
      values: [userId, content, image || null]
    }
    const {rows} = await pool.query(createPost);
    const info = rows[0];
    
    if (!image) {
      delete info.image;
    }
    return info;
  }

  public async get(userId: string, page: number, size: number) {
    const forVisiblePosts = {
      text: `
        SELECT 
          p.id AS id,
          m.id as member,
          p.data->>'content' AS content,
          p.data->>'posted' AS posted,
          p.data->>'image' AS image
        FROM post p
        JOIN member m ON m.id = p.member
        LEFT JOIN friend f ON (
          (f.sender = $1 AND f.receiver = p.member) OR
          (f.receiver = $1 AND f.sender = p.member)
        )
        WHERE
          (p.member = $1 OR f.data->>'accepted' = 'true')
          AND (m.data->>'is_active')::boolean = true
        ORDER BY p.data->>'posted' DESC
        LIMIT $2 OFFSET $3;
      `,
      values: [userId, size, (page - 1) * size]
    };
    const {rows} = await pool.query(forVisiblePosts);
    return rows;
  }
}