import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db';

import { SessionUser } from '../types/express';

import { Credentials, Authenticated, NewMember, CurrentMember } from './schema';

const SECRET = process.env.SECRET || crypto.randomBytes(32);
const KEY = process.env.KEY || crypto.randomBytes(32);

const MIDT_SECRET = crypto.randomBytes(32);

const CRYPT_ALGORITHM = 'aes-256-gcm';
const JWT_ALGORITHM = 'HS256';

interface Hash {
  iv: string;
  encryptedData: string;
  authTag: string;
};

interface JwtHash extends Hash {
  iat?: number;
  exp?: number
};

/**
 * encrypts plain text
 * @param {string} text - plain text 
 * @returns {Hash} - obj containing iv, ciphertext, auth tag
 */
export function encrypt(text: string): Hash {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    CRYPT_ALGORITHM, Buffer.from(KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return { 
    iv: iv.toString('hex'),
    encryptedData: encrypted, 
    authTag: authTag.toString('hex') 
  };
}

/**
 * decrypts cipher text
 * @param {string} hash - cipher text 
 * @returns {string} - plain text
 */
function decrypt(hash: Hash): string {
  const decipher = crypto.createDecipheriv(
    CRYPT_ALGORITHM, Buffer.from(KEY), Buffer.from(hash.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(hash.authTag, 'hex'));
  let decrypted = decipher.update(hash.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function emailExists(email: string): Promise<boolean> {
  const forEmail = {
    text: `
      SELECT 1 FROM member
      WHERE data->>'email' = $1
    `,
    values: [email]
  }

  const {rows} = await pool.query(forEmail);
  return rows.length > 0;
}


export class AuthService {
  /**
   * Login
   * @param {Credentials} credentials - user creds 
   * @returns {Authenticated} - obj with name + jwt
   */
  public async login(credentials: Credentials): Promise<Authenticated> {
    const validCreds = {
      text: `
        SELECT
          id,
          data->>'name' AS name,
          COALESCE((data->>'is_active')::boolean, true) AS "isActive"
        FROM member
        WHERE data->>'email' = $1
        AND data->>'pwhash' = crypt($2, data->>'pwhash')
      `,
      values: [credentials.email, credentials.password],
    };
    const {rows} = await pool.query(validCreds);
    const user = rows[0];

    if (!user) {
      throw new Error("Unauthorized");
    }

    if (!user.isActive) {
      throw new Error("Your account has been deactivated");
    }

    const payload = encrypt(JSON.stringify({id: user.id}));
    const authToken = jwt.sign(payload, SECRET, {
      expiresIn: '30m',
      algorithm: JWT_ALGORITHM,
    });

    return new Authenticated(user.name, authToken);
  }

  public async signup(member: NewMember): Promise<CurrentMember> {
    if (await emailExists(member.email)) {
      throw new Error('Email already in use');
    }

    const {email, name, password} = member;

    const createUser = {
      text: `
        INSERT INTO member(data) 
        VALUES (
          jsonb_build_object(
            'email', $1::text,
            'name', $2::text,
            'pwhash',crypt($3::text, gen_salt('bf')),
            'roles', ARRAY['member'],
            'is_active', true
          )
        )
        RETURNING data->>'name' AS name, data->>'email' AS email;
      `,
      values: [email, name, password]
    };
    const {rows: members} = await pool.query(createUser);
    return members[0];
  }

  public async check(authHeader?: string, scopes: string[] = []): Promise<SessionUser> {
    return new Promise((resolve, reject) => {
      if(!authHeader) {
        reject(new Error('Unauthorized'));
      } else {
        const bearerToken = authHeader.split(' ')[1];
        jwt.verify(bearerToken, SECRET,
          async (err: jwt.VerifyErrors | null, decoded?: object | string) => {
            if (err) {
              reject(err);
            } else {
              delete (decoded as JwtHash).iat;
              delete (decoded as JwtHash).exp;
              const uid = JSON.parse(decrypt(decoded as Hash));

              const forUser = {
                text: `
                  SELECT id, data->>'roles' as roles
                  FROM member
                  WHERE id = $1
                  `,
                values: [uid.id]
              }
              const {rows: users} = await pool.query(forUser);
              const user = users[0];

              if (user) {
                for (const scope of scopes) {
                  if (!user.roles || !user.roles.includes(scope)) {
                    reject(new Error("Unauthorized"));
                  }
                }
                resolve({id: user.id});
              }
              reject(new Error("Unauthorized"));
            }
          }
        );
      }
    });
  }

  public createMidt(id: string): string {
    const hash = encrypt(JSON.stringify({ id }));
    const token = jwt.sign(hash, MIDT_SECRET, {
      expiresIn: '30m',
      algorithm: JWT_ALGORITHM,
    });

    return token;
  }

  public decodeMidt(midt: string): string {
    const hash = jwt.verify(midt, MIDT_SECRET) as Hash;
    const decrypted = decrypt(hash);
    const parsed = JSON.parse(decrypted);
    return parsed.id;
  }
}
