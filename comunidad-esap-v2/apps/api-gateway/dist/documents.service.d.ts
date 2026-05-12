import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DocumentEntity } from './document.entity';
export declare class DocumentsService implements OnModuleInit {
    private readonly documentsRepository;
    constructor(documentsRepository: Repository<DocumentEntity>);
    onModuleInit(): Promise<void>;
    findAll(): Promise<DocumentEntity[]>;
    create(data: Partial<DocumentEntity>): Promise<DocumentEntity>;
    seedInitialData(): Promise<void>;
    remove(id: string): Promise<void>;
}
