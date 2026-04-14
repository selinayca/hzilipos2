import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.find({
      where: { tenantId },
      select: ['id', 'email', 'name', 'role', 'isActive', 'lastLoginAt', 'createdAt'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(tenantId: string, dto: CreateUserDto): Promise<User> {
    const exists = await this.repo.existsBy({ tenantId, email: dto.email.toLowerCase() });
    if (exists) throw new ConflictException(`Email "${dto.email}" already exists`);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({
      tenantId,
      email: dto.email.toLowerCase(),
      name: dto.name,
      passwordHash,
      role: dto.role,
    });
    await this.repo.save(user);

    // Return without sensitive fields
    const { passwordHash: _, refreshTokenHash: __, ...safe } = user as any;
    return safe;
  }

  async toggleActive(tenantId: string, userId: string, requesterId: string): Promise<User> {
    if (userId === requesterId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }
    const user = await this.repo.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = !user.isActive;
    return this.repo.save(user);
  }

  async resetPassword(tenantId: string, userId: string, newPassword: string): Promise<void> {
    const user = await this.repo.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.refreshTokenHash = null; // force re-login
    await this.repo.save(user);
  }
}
