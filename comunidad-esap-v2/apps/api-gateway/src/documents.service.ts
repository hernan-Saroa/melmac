import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from './document.entity';

@Injectable()
export class DocumentsService implements OnModuleInit {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
  ) {}

  async onModuleInit() {
    await this.seedInitialData();
  }

  async findAll(): Promise<DocumentEntity[]> {
    return this.documentsRepository.find({
      order: { date: 'DESC' }
    });
  }

  async create(data: Partial<DocumentEntity>): Promise<DocumentEntity> {
    const newDoc = this.documentsRepository.create({
      ...data,
      status: 'En Revisión', // Por defecto
    });
    return this.documentsRepository.save(newDoc);
  }

  // Método de semilla para desarrollo local
  async seedInitialData(): Promise<void> {
    const count = await this.documentsRepository.count();
    if (count === 0) {
      await this.documentsRepository.save([
        { title: 'Plan Anual 2026', status: 'Aprobado', author: 'Ana Pérez' },
        { title: 'Auditoría Interna Q1', status: 'En Revisión', author: 'Carlos Ruiz' },
        { title: 'Contrato Legal 405', status: 'Pendiente', author: 'María López' },
        { title: 'Reporte Financiero', status: 'Aprobado', author: 'Jorge Díaz' },
      ]);
    }
  }

  async remove(id: string): Promise<void> {
    await this.documentsRepository.delete(id);
  }
}
