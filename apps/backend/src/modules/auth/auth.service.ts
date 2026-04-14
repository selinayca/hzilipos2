import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { User, UserRole } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const BCRYPT_ROUNDS = 12;
const REFRESH_COOKIE = 'refresh_token';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
  ) {}

  // ── Login ─────────────────────────────────────────────────────────────

  async login(dto: LoginDto, tenantId: string, res: Response) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase(), tenantId, isActive: true },
      select: ['id', 'email', 'name', 'role', 'tenantId', 'passwordHash'],
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);

    // Store hashed refresh token for single-device invalidation
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, BCRYPT_ROUNDS);
    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    this.setRefreshCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  // ── Refresh ───────────────────────────────────────────────────────────

  async refresh(refreshToken: string, res: Response) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub, isActive: true },
      select: ['id', 'email', 'role', 'tenantId', 'refreshTokenHash'],
    });

    if (!user?.refreshTokenHash) throw new UnauthorizedException('Logged out');

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) throw new UnauthorizedException('Refresh token reuse detected');

    const tokens = await this.issueTokens(user);
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, BCRYPT_ROUNDS);
    await this.userRepo.save(user);

    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  // ── Logout ────────────────────────────────────────────────────────────

  async logout(userId: string, res: Response) {
    await this.userRepo.update(userId, { refreshTokenHash: null });
    res.clearCookie(REFRESH_COOKIE);
  }

  // ── Register tenant (self-service onboarding) ──────────────────────

  async registerTenant(dto: RegisterTenantDto) {
    const slugTaken = await this.tenantRepo.existsBy({ slug: dto.slug });
    if (slugTaken) {
      throw new ConflictException(`Subdomain "${dto.slug}" is already taken`);
    }

    // Wrap in transaction: both tenant and admin user must be created atomically
    return this.dataSource.transaction(async (em) => {
      const tenant = em.create(Tenant, {
        slug: dto.slug,
        name: dto.businessName,
      });
      await em.save(tenant);

      const passwordHash = await bcrypt.hash(dto.adminPassword, BCRYPT_ROUNDS);
      const admin = em.create(User, {
        tenantId: tenant.id,
        email: dto.adminEmail.toLowerCase(),
        name: dto.adminName,
        passwordHash,
        role: UserRole.TENANT_ADMIN,
      });
      await em.save(admin);

      return {
        tenantId: tenant.id,
        slug: tenant.slug,
        posUrl: `https://${tenant.slug}.${this.config.get('APP_DOMAIN')}`,
      };
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async issueTokens(user: Pick<User, 'id' | 'email' | 'role' | 'tenantId'>) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private setRefreshCookie(res: Response, token: string) {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: sevenDays,
      path: '/api/v1/auth',
    });
  }
}
