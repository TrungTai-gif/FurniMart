import { NotFoundException } from '@nestjs/common';

/**
 * Base controller với các method CRUD chung
 * Giảm code trùng lặp trong các controller
 */
export abstract class BaseController<T> {
  protected abstract service: any;

  protected formatResponse?(entity: any): any {
    return entity;
  }

  async findAll(filters?: any): Promise<T[]> {
    const results = await this.service.findAll(filters);
    return this.formatResponse
      ? results.map((r: any) => this.formatResponse!(r))
      : results;
  }

  async findById(id: string): Promise<T> {
    const result = await this.service.findById(id);
    if (!result) {
      throw new NotFoundException('Resource not found');
    }
    return this.formatResponse ? this.formatResponse(result) : result;
  }

  async create(createDto: any): Promise<T> {
    const result = await this.service.create(createDto);
    return this.formatResponse ? this.formatResponse(result) : result;
  }

  async update(id: string, updateDto: any): Promise<T> {
    const result = await this.service.update(id, updateDto);
    if (!result) {
      throw new NotFoundException('Resource not found');
    }
    return this.formatResponse ? this.formatResponse(result) : result;
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.service.delete(id);
    if (!result) {
      throw new NotFoundException('Resource not found');
    }
    return { message: 'Deleted successfully' };
  }
}

