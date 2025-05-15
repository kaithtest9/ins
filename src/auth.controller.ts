import { Body, Post, Route, Tags, SuccessResponse, Controller, Res, TsoaResponse } from 'tsoa';
import { db, users } from './db';
import { hashPassword, comparePassword, generateToken } from './utils';
import { eq } from 'drizzle-orm';

export interface UserRegistrationInput {
  username: string;
  email: string;
  password: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: { id: number; username: string; email: string };
  token: string;
}
export interface UserPublicProfile {
    id: number;
    username: string;
    email: string; // Consider if email should be public
}

@Route('auth')
@Tags('Authentication')
export class AuthController extends Controller {
  @SuccessResponse(201, 'User Created')
  @Post('register')
  public async register(
    @Body() body: UserRegistrationInput,
    @Res() badRequestResponse: TsoaResponse<400, { message: string }>,
    @Res() conflictResponse: TsoaResponse<409, { message: string }>
  ): Promise<UserPublicProfile> {
    const existingUser = await db.query.users.findFirst({
      where: (user, { or }) => or(eq(user.email, body.email), eq(user.username, body.username)),
    });

    if (existingUser) {
      if (existingUser.email === body.email) {
        return conflictResponse(409, { message: 'Email already in use' });
      }
      if (existingUser.username === body.username) {
        return conflictResponse(409, { message: 'Username already taken' });
      }
    }

    const hashedPassword = await hashPassword(body.password);
    const [newUser] = await db.insert(users)
      .values({ username: body.username, email: body.email, passwordHash: hashedPassword })
      .returning({ id: users.id, username: users.username, email: users.email });

    if (!newUser) {
       return badRequestResponse(400, { message: 'User registration failed' });
    }
    this.setStatus(201);
    return newUser;
  }

  @Post('login')
  public async login(
    @Body() body: UserLoginInput,
    @Res() unauthorizedResponse: TsoaResponse<401, { message: string }>
  ): Promise<AuthResponse> {
    const user = await db.query.users.findFirst({ where: eq(users.email, body.email) });
    if (!user || !(await comparePassword(body.password, user.passwordHash))) {
      return unauthorizedResponse(401, { message: 'Invalid email or password' });
    }

    const token = generateToken({ userId: user.id, username: user.username });
    return {
      user: { id: user.id, username: user.username, email: user.email },
      token,
    };
  }
}