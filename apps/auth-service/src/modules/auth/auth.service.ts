import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Prisma } from '@prisma-client';
import bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

import { AUTH_DEFAULT_USER_ROLE_ID } from '@/common/constants/auth.constants';
import { RegisterAndSignInDto } from '@/modules/user/dto/register-and-sign-in.dto';
import { UserService } from '@/modules/user/user.service';

import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name, { timestamp: true });
  private readonly bcryptSaltRounds: number;
  private readonly defaultUserRoleId: number;
  private readonly jwtExpiresIn: number;
  private readonly dummyHash: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {
    this.bcryptSaltRounds = Number(this.configService.get<number>('AUTH_BCRYPT_SALT_ROUNDS', 10));
    this.defaultUserRoleId = AUTH_DEFAULT_USER_ROLE_ID;
    this.jwtExpiresIn = this.configService.get<number>('AUTH_JWT_EXPIRATION', 3600);
    this.dummyHash = bcrypt.hashSync('dummy_password_for_timing', this.bcryptSaltRounds);
  }

  async register(body: RegisterAndSignInDto): Promise<AuthResponseDto> {
    const { email, password } = body;

    const uuid = uuidv7();
    const hashedPassword = await bcrypt.hash(password, this.bcryptSaltRounds);

    const data: Prisma.UserCreateInput = {
      id: uuid,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: {
        connect: { id: this.defaultUserRoleId },
      },
    };

    const newUser = await this.userService.createUser(data);
    return this.generateAuthResponse(newUser.id, newUser.roleId);
  }

  async login(body: RegisterAndSignInDto): Promise<AuthResponseDto> {
    const { email, password } = body;

    const user = await this.userService.getUser({ email: email.toLowerCase() });
    // Perform comparison even if user doesn't exist to prevent timing attacks
    const passwordToCompare = user?.password || this.dummyHash;
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return this.generateAuthResponse(user.id, user.roleId);
  }

  private async generateAuthResponse(userId: string, roleId: number): Promise<AuthResponseDto> {
    const payload = { sub: userId, role: roleId };

    try {
      const token = await this.jwtService.signAsync(payload, {
        expiresIn: this.jwtExpiresIn,
      });

      return {
        access_token: token,
        token_type: 'Bearer',
        expires_in: this.jwtExpiresIn,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('JWT Signing Failed:', { error: errorMessage, userId });
      throw new InternalServerErrorException('Could not generate session');
    }
  }
}
