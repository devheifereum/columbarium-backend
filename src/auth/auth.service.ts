import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) { }

  async signUp(email: string, password: string): Promise<{ message: string }> {
    const token = uuidv4();
    const expiresIn = this.config.get<string>('EMAIL_VERIFICATION_EXPIRES_IN', '24h');
    const expiresAt = this.parseExpiry(expiresIn);
    const frontendUrl = this.config.get<string>('APP_FRONTEND_URL', 'http://localhost:3000');
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    await this.prisma.$transaction(async (tx) => {
      const createdUser = await this.usersService.create(email, password, tx);
      await tx.emailVerificationToken.create({
        data: { token, userId: createdUser.id, expiresAt },
      });
      await this.emailService.sendVerificationEmail(createdUser.email, verificationLink);
    });

    return {
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return user;
  }

  async signIn(user: User): Promise<{ access_token: string; user: { id: string; email: string } }> {
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before signing in. Check your inbox for the verification link.',
      );
    }
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);
    return {
      access_token,
      user: { id: user.id, email: user.email },
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const record = await this.prisma.emailVerificationToken.findFirst({
      where: { token, used: false },
      include: { user: true },
    });
    if (!record) {
      throw new BadRequestException('Invalid or expired verification link.');
    }
    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Verification link has expired.');
    }
    await this.prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { used: true },
    });
    await this.usersService.markEmailVerified(record.userId);
    return { message: 'Email verified successfully. You can now sign in.' };
  }

  async getProfile(userId: string): Promise<{ id: string; email: string; emailVerified: boolean }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const successMessage =
      'If an account with that email exists and is not yet verified, a new verification email has been sent.';

    const user = await this.usersService.findByEmail(email);
    if (!user || user.emailVerified) {
      return { message: successMessage };
    }

    // Invalidate all existing unused tokens for this user
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = uuidv4();
    const expiresIn = this.config.get<string>(
      'EMAIL_VERIFICATION_EXPIRES_IN',
      '24h',
    );
    const expiresAt = this.parseExpiry(expiresIn);
    const frontendUrl = this.config.get<string>(
      'APP_FRONTEND_URL',
      'http://localhost:3000',
    );
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    await this.prisma.emailVerificationToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    await this.emailService.sendVerificationEmail(user.email, verificationLink);

    return { message: successMessage };
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.emailVerificationToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  private parseExpiry(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) return new Date(Date.now() + 24 * 60 * 60 * 1000);
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      d: 24 * 60 * 60 * 1000,
      h: 60 * 60 * 1000,
      m: 60 * 1000,
      s: 1000,
    };
    return new Date(Date.now() + value * (multipliers[unit] ?? 86400000));
  }
}
